import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@soporteqr/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setErrorApi(null);
    try {
      await login(data.email, data.password);
      const destino = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(destino, { replace: true });
    } catch (error) {
      setErrorApi(error instanceof ApiError ? error.message : 'No se pudo iniciar sesion');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-marino-950">Iniciar sesion</h1>
        <p className="mt-1 text-sm text-grafito-500">Accede con tu cuenta institucional</p>
      </div>

      {errorApi && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorApi}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-marino-800">
          Correo electronico
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
          Contrasena
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
        disabled={isSubmitting}
        className="w-full rounded-lg bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marino-900 disabled:opacity-60"
      >
        {isSubmitting ? 'Ingresando...' : 'Ingresar'}
      </button>

      <div className="rounded-lg bg-grafito-100 px-3 py-2.5 text-xs text-grafito-500">
        <p className="font-semibold text-grafito-500">Cuentas de demostracion</p>
        <p>admin@soporteqr.demo · tecnico@soporteqr.demo · empleado@soporteqr.demo</p>
      </div>
    </form>
  );
}
