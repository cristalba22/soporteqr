import { AssetStatus, UserRole } from '@soporteqr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { ASSET_ESTADO_LABELS } from '../lib/labels';
import { createAsset, getAssetQrUrl, getAssets, getLocations } from '../lib/api';

const initialForm = {
  codigoInterno: '',
  tipo: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  locationId: '',
};

export function AssetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const assetsQuery = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations });
  const puedeAdministrar = user?.role === UserRole.ADMINISTRADOR;

  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      setForm(initialForm);
      setMostrarFormulario(false);
      setError('');
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'No se pudo crear el activo'),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    createMutation.mutate({
      codigoInterno: form.codigoInterno,
      tipo: form.tipo,
      marca: form.marca || undefined,
      modelo: form.modelo || undefined,
      numeroSerie: form.numeroSerie || undefined,
      locationId: form.locationId,
      estado: AssetStatus.ACTIVO,
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-marino-950">Activos</h1>
          <p className="mt-1 text-sm text-grafito-500">Equipos registrados y etiquetas QR de soporte</p>
        </div>
        {puedeAdministrar && (
          <button
            type="button"
            onClick={() => setMostrarFormulario((actual) => !actual)}
            className="rounded-lg bg-turquesa-500 px-4 py-2.5 text-sm font-semibold text-marino-950 hover:bg-turquesa-400"
          >
            {mostrarFormulario ? 'Cancelar' : 'Nuevo activo'}
          </button>
        )}
      </header>

      {mostrarFormulario && puedeAdministrar && (
        <form onSubmit={submit} className="rounded-xl border border-grafito-200 bg-white p-5 shadow-panel">
          <h2 className="text-sm font-semibold text-marino-900">Registrar activo</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Codigo interno" value={form.codigoInterno} required onChange={(value) => setForm({ ...form, codigoInterno: value })} />
            <Field label="Tipo" value={form.tipo} required onChange={(value) => setForm({ ...form, tipo: value })} placeholder="PC, impresora, router..." />
            <Field label="Marca" value={form.marca} onChange={(value) => setForm({ ...form, marca: value })} />
            <Field label="Modelo" value={form.modelo} onChange={(value) => setForm({ ...form, modelo: value })} />
            <Field label="Numero de serie" value={form.numeroSerie} onChange={(value) => setForm({ ...form, numeroSerie: value })} />
            <label className="text-sm font-medium text-marino-900">
              Ubicacion
              <select
                required
                value={form.locationId}
                onChange={(event) => setForm({ ...form, locationId: event.target.value })}
                className="mt-1.5 w-full rounded-lg border border-grafito-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-turquesa-500"
              >
                <option value="">Seleccionar...</option>
                {locationsQuery.data?.map((location) => <option key={location.id} value={location.id}>{location.nombre}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button disabled={createMutation.isPending} className="mt-4 rounded-lg bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {createMutation.isPending ? 'Guardando...' : 'Guardar activo'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-grafito-200 bg-white shadow-panel">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-grafito-100 text-xs uppercase tracking-wide text-grafito-500">
            <tr>
              <th className="px-4 py-3">Codigo</th><th className="px-4 py-3">Equipo</th><th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3">Estado</th><th className="px-4 py-3">Incidencias</th><th className="px-4 py-3">Etiqueta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grafito-200">
            {assetsQuery.isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-grafito-500">Cargando activos...</td></tr>}
            {assetsQuery.isError && <tr><td colSpan={6} className="px-4 py-8 text-center text-red-600">No se pudieron cargar los activos.</td></tr>}
            {assetsQuery.data?.map((asset) => (
              <tr key={asset.id} className="hover:bg-grafito-100/60">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-marino-800">{asset.codigoInterno}</td>
                <td className="px-4 py-3"><p className="font-medium text-marino-900">{asset.tipo}</p><p className="text-xs text-grafito-500">{[asset.marca, asset.modelo].filter(Boolean).join(' ') || 'Sin marca/modelo'}</p></td>
                <td className="px-4 py-3 text-grafito-600">{asset.location.nombre}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-grafito-100 px-2.5 py-1 text-xs font-medium text-marino-800">{ASSET_ESTADO_LABELS[asset.estado]}</span></td>
                <td className="px-4 py-3 text-center text-marino-800">{asset._count.tickets}</td>
                <td className="px-4 py-3"><a href={getAssetQrUrl(asset.publicAssetCode)} target="_blank" rel="noreferrer" className="font-semibold text-turquesa-600 hover:underline">Ver QR</a></td>
              </tr>
            ))}
            {assetsQuery.data?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-grafito-500">No hay activos registrados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return <label className="text-sm font-medium text-marino-900">{label}<input required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-grafito-200 px-3 py-2.5 text-sm outline-none focus:border-turquesa-500" /></label>;
}
