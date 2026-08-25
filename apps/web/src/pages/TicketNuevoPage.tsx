import { zodResolver } from '@hookform/resolvers/zod';
import { createTicketSchema, TicketImpact, type CreateTicketInput } from '@soporteqr/shared';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { api, ApiError } from '../lib/api';
import { QrScanner } from '../components/QrScanner';

interface Categoria {
  id: string;
  nombre: string;
}

interface AssetPublico {
  codigoInterno: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  location: { nombre: string };
}

export function TicketNuevoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const assetCode = searchParams.get('activo') ?? '';

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<{ categories: Categoria[] }>('/api/categories'),
  });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      assetPublicCode: assetCode,
      impacto: TicketImpact.PERSONA,
      servicioInterrumpido: false,
      tieneAlternativa: true,
      riesgoSeguridad: false,
    },
  });

  const codigoActivo = watch('assetPublicCode');
  const onQrDetectado = useCallback((code: string) => {
    setValue('assetPublicCode', code, { shouldDirty: true, shouldValidate: true });
    clearErrors('assetPublicCode');
  }, [clearErrors, setValue]);
  const { data: asset } = useQuery({
    queryKey: ['asset-resuelto', codigoActivo],
    queryFn: () => api.get<{ asset: AssetPublico }>(`/api/assets/resolver/${encodeURIComponent(codigoActivo)}`),
    enabled: codigoActivo.trim().length >= 4,
    retry: false,
  });

  const onSubmit = async (data: CreateTicketInput) => {
    try {
      const respuesta = await api.post<{ ticket: { id: string } }>('/api/tickets', data);
      navigate(`/tickets/${respuesta.ticket.id}`);
    } catch (error) {
      setError('assetPublicCode', {
        message: error instanceof ApiError ? error.message : 'No se pudo crear el ticket',
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-marino-950">Nuevo ticket</h1>
        <p className="mt-1 text-sm text-grafito-500">Reporta una incidencia sobre un activo</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-xl border border-grafito-200 bg-white p-6 shadow-panel"
      >
        <div>
          <label htmlFor="assetPublicCode" className="mb-1 block text-sm font-medium text-marino-800">
            Codigo QR o codigo interno
          </label>
          <input
            id="assetPublicCode"
            className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500 focus:ring-2 focus:ring-turquesa-500/20"
            {...register('assetPublicCode')}
          />
          {errors.assetPublicCode && (
            <p className="mt-1 text-xs text-red-600">{errors.assetPublicCode.message}</p>
          )}
          <QrScanner onDetected={onQrDetectado} />
          {asset && (
            <p className="mt-2 rounded-lg bg-grafito-100 px-3 py-2 text-xs text-grafito-500">
              {asset.asset.tipo} {asset.asset.marca ?? ''} {asset.asset.modelo ?? ''} · {asset.asset.location.nombre}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-marino-800">
            Titulo
          </label>
          <input
            id="titulo"
            className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500 focus:ring-2 focus:ring-turquesa-500/20"
            {...register('titulo')}
          />
          {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
        </div>

        <div>
          <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-marino-800">
            Descripcion
          </label>
          <textarea
            id="descripcion"
            rows={5}
            className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500 focus:ring-2 focus:ring-turquesa-500/20"
            {...register('descripcion')}
          />
          {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>}
        </div>

        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-marino-800">
            Categoria (opcional)
          </label>
          <select
            id="categoryId"
            className="w-full rounded-lg border border-grafito-300 bg-white px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500"
            {...register('categoryId')}
          >
            <option value="">Detectar automaticamente</option>
            {categorias?.categories.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
        </div>

        <div className="rounded-xl border border-turquesa-500/25 bg-turquesa-500/5 p-4">
          <div className="mb-4">
            <p className="text-sm font-semibold text-marino-950">Evaluacion automatica del impacto</p>
            <p className="mt-1 text-xs text-grafito-500">Responde estas preguntas. El sistema asignara la prioridad y dejara registrado el motivo.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="impacto" className="mb-1 block text-sm font-medium text-marino-800">
              ¿A cuantas personas afecta?
            </label>
            <select
              id="impacto"
              className="w-full rounded-lg border border-grafito-300 bg-white px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500"
              {...register('impacto')}
            >
              <option value={TicketImpact.PERSONA}>Una persona</option>
              <option value={TicketImpact.SECTOR}>Un sector completo</option>
              <option value={TicketImpact.ORGANIZACION}>Toda la organizacion</option>
            </select>
          </div>
          <div className="space-y-3 text-sm text-marino-800">
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" {...register('servicioInterrumpido')} /><span>El trabajo quedo detenido</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" {...register('tieneAlternativa')} /><span>Hay otro equipo o forma de continuar</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" {...register('riesgoSeguridad')} /><span>Existe riesgo electrico, de seguridad o de perdida de informacion</span></label>
          </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-turquesa-500 px-4 py-2.5 text-sm font-semibold text-marino-950 transition-colors hover:bg-turquesa-400 disabled:opacity-60"
        >
          {isSubmitting ? 'Creando...' : 'Crear ticket'}
        </button>
      </form>
    </div>
  );
}
