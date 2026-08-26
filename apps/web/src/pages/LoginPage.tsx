import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@soporteqr/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DEMO_PASSWORD = 'Demo1234!';
const DEMO_ACCOUNTS = [
  { role: 'Administrador', email: 'admin@soporteqr.demo', detail: 'Dashboard, activos y configuración' },
  { role: 'Técnico', email: 'tecnico@soporteqr.demo', detail: 'Asignación, diagnóstico y resolución' },
  { role: 'Empleado', email: 'empleado@soporteqr.demo', detail: 'Reporte y seguimiento de solicitudes' },
] as const;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const ingresar = async (email: string, password: string) => {
    setErrorApi(null);
    try {
      await login(email, password);
      const destino = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(destino, { replace: true });
    } catch (error) {
      setErrorApi(error instanceof ApiError ? error.message : 'No se pudo iniciar sesión');
    }
  };

  const onSubmit = async (data: LoginInput) => ingresar(data.email, data.password);

  const ingresarDemo = async (email: string) => {
    setDemoLoading(email);
    try {
      await ingresar(email, DEMO_PASSWORD);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-marino-950">Explorar la demostración</h1>
        <p className="mt-1 text-sm text-grafito-500">Elegí un perfil para recorrer el flujo completo.</p>
      </div>

      {errorApi && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorApi}
        </div>
      )}

      <div className="grid gap-2" aria-label="Accesos rápidos de demostración">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={Boolean(demoLoading) || isSubmitting}
            onClick={() => void ingresarDemo(account.email)}
            className="group flex items-center justify-between rounded-xl border border-grafito-200 bg-white px-3.5 py-3 text-left transition hover:border-turquesa-500 hover:bg-turquesa-500/5 disabled:cursor-wait disabled:opacity-60"
          >
            <span>
              <span className="block text-sm font-semibold text-marino-950">{account.role}</span>
              <span className="mt-0.5 block text-[11px] text-grafito-500">{account.detail}</span>
            </span>
            <span className="text-xs font-bold text-turquesa-600 transition group-hover:translate-x-0.5">
              {demoLoading === account.email ? 'Ingresando…' : 'Probar →'}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-grafito-200" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-grafito-400">Acceso manual</span>
        <span className="h-px flex-1 bg-grafito-200" />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-marino-800">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none transition-colors focus:border-turquesa-500 focus:ring-2 focus:ring-turquesa-500/20"
          {...register('email')}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-marino-800">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none transition-colors focus:border-turquesa-500 focus:ring-2 focus:ring-turquesa-500/20"
          {...register('password')}
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || Boolean(demoLoading)}
        className="w-full rounded-lg bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marino-900 disabled:opacity-60"
      >
        {isSubmitting ? 'Ingresando...' : 'Ingresar'}
      </button>
      <p className="text-center text-[11px] leading-4 text-grafito-400">Entorno demostrativo con información ficticia y permisos diferenciados por rol.</p>
    </form>
  );
}
