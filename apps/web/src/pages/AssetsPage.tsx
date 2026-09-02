import { AssetStatus, UserRole } from '@soporteqr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { ASSET_ESTADO_LABELS } from '../lib/labels';
import {
  createAsset,
  getAssetQrUrl,
  getAssets,
  getLocations,
  updateAsset,
  type AssetListItem,
} from '../lib/api';

const initialForm = {
  codigoInterno: '',
  tipo: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  locationId: '',
  estado: AssetStatus.ACTIVO as AssetStatus,
};

const ESTADO_CLASSES: Record<AssetStatus, string> = {
  [AssetStatus.ACTIVO]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [AssetStatus.EN_REPARACION]: 'bg-amber-50 text-amber-700 border-amber-200',
  [AssetStatus.DE_BAJA]: 'bg-red-50 text-red-700 border-red-200',
  [AssetStatus.EN_DEPOSITO]: 'bg-grafito-100 text-grafito-600 border-grafito-200',
};

const assetHealth = (asset: AssetListItem) => {
  const penalty =
    asset._count.tickets * 7 +
    (asset.estado === AssetStatus.EN_REPARACION ? 28 : 0) +
    (asset.estado === AssetStatus.DE_BAJA ? 55 : 0);
  const score = Math.max(10, 100 - penalty);
  return {
    score,
    label: score >= 80 ? 'Saludable' : score >= 55 ? 'Observar' : 'Intervenir',
    tone: score >= 80 ? 'bg-emerald-500' : score >= 55 ? 'bg-amber-500' : 'bg-red-500',
  };
};

export function AssetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('buscar') ?? '';
  const estado = searchParams.get('estado') ?? '';
  const locationId = searchParams.get('locationId') ?? '';
  const [editing, setEditing] = useState<AssetListItem | 'new' | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const assetsQuery = useQuery({ queryKey: ['assets'], queryFn: getAssets });
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations });
  const puedeAdministrar = user?.role === UserRole.ADMINISTRADOR;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = {
        codigoInterno: form.codigoInterno,
        tipo: form.tipo,
        marca: form.marca || undefined,
        modelo: form.modelo || undefined,
        numeroSerie: form.numeroSerie || undefined,
        locationId: form.locationId,
        estado: form.estado,
      };
      if (editing === 'new') return createAsset(input);
      if (!editing) throw new Error('Activo inválido');
      await updateAsset(editing.id, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      setEditing(null);
      setForm(initialForm);
      setError('');
    },
    onError: (cause) =>
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el activo'),
  });

  const openNew = () => {
    setForm(initialForm);
    setEditing('new');
    setError('');
  };
  const openEdit = (asset: AssetListItem) => {
    setForm({
      codigoInterno: asset.codigoInterno,
      tipo: asset.tipo,
      marca: asset.marca ?? '',
      modelo: asset.modelo ?? '',
      numeroSerie: asset.numeroSerie ?? '',
      locationId: asset.location.id,
      estado: asset.estado,
    });
    setEditing(asset);
    setError('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    saveMutation.mutate();
  };
  const updateFilter = (key: 'buscar' | 'estado' | 'locationId', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const assets = assetsQuery.data ?? [];
  const filteredAssets = assets.filter((asset) => {
    const term = search.trim().toLocaleLowerCase('es');
    const matchesSearch =
      !term ||
      [asset.codigoInterno, asset.tipo, asset.marca, asset.modelo, asset.numeroSerie]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('es').includes(term));
    return (
      matchesSearch &&
      (!estado || asset.estado === estado) &&
      (!locationId || asset.location.id === locationId)
    );
  });
  const activos = assets.filter((asset) => asset.estado === AssetStatus.ACTIVO).length;
  const enReparacion = assets.filter((asset) => asset.estado === AssetStatus.EN_REPARACION).length;
  const incidencias = assets.reduce((total, asset) => total + asset._count.tickets, 0);

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-marino-950 to-marino-800 p-6 text-white shadow-panel sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-turquesa-300">
            Parque tecnológico
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Activos conectados</h1>
          <p className="mt-1 text-sm text-marino-200">
            Cada equipo enlaza su identidad QR, ubicación e historial de incidencias.
          </p>
        </div>
        {puedeAdministrar && (
          <button
            type="button"
            onClick={openNew}
            className="rounded-xl bg-turquesa-500 px-4 py-2.5 text-sm font-semibold text-marino-950 hover:bg-turquesa-400"
          >
            Registrar activo
          </button>
        )}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AssetMetric
          label="Inventario"
          value={assets.length}
          detail="Equipos registrados"
          tone="bg-marino-600"
        />
        <AssetMetric
          label="Operativos"
          value={activos}
          detail={`${Math.round((activos / Math.max(1, assets.length)) * 100)}% del parque`}
          tone="bg-emerald-500"
        />
        <AssetMetric
          label="En reparación"
          value={enReparacion}
          detail={enReparacion ? 'Requieren seguimiento' : 'Sin bloqueos'}
          tone="bg-amber-500"
        />
        <AssetMetric
          label="Incidencias históricas"
          value={incidencias}
          detail="Conectadas al dashboard"
          tone="bg-turquesa-500"
        />
      </section>

      {editing && puedeAdministrar && (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-turquesa-200 bg-turquesa-50/70 p-5 shadow-panel"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-turquesa-700">
                Ficha técnica
              </p>
              <h2 className="mt-1 font-semibold text-marino-950">
                {editing === 'new' ? 'Registrar activo' : `Editar ${editing.codigoInterno}`}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-sm font-semibold text-grafito-500 hover:text-marino-900"
            >
              Cancelar
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Código interno"
              value={form.codigoInterno}
              required
              onChange={(value) => setForm({ ...form, codigoInterno: value })}
            />
            <Field
              label="Tipo"
              value={form.tipo}
              required
              onChange={(value) => setForm({ ...form, tipo: value })}
              placeholder="PC, impresora, router..."
            />
            <Field
              label="Marca"
              value={form.marca}
              onChange={(value) => setForm({ ...form, marca: value })}
            />
            <Field
              label="Modelo"
              value={form.modelo}
              onChange={(value) => setForm({ ...form, modelo: value })}
            />
            <Field
              label="Número de serie"
              value={form.numeroSerie}
              onChange={(value) => setForm({ ...form, numeroSerie: value })}
            />
            <SelectField
              label="Sucursal"
              value={form.locationId}
              required
              onChange={(value) => setForm({ ...form, locationId: value })}
              options={(locationsQuery.data ?? []).map((item) => ({
                value: item.id,
                label: item.nombre,
              }))}
              empty="Seleccionar..."
            />
            <SelectField
              label="Estado operativo"
              value={form.estado}
              onChange={(value) => setForm({ ...form, estado: value as AssetStatus })}
              options={Object.values(AssetStatus).map((value) => ({
                value,
                label: ASSET_ESTADO_LABELS[value],
              }))}
            />
          </div>
          {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}
          <button
            disabled={saveMutation.isPending}
            className="mt-4 rounded-xl bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saveMutation.isPending
              ? 'Guardando...'
              : editing === 'new'
                ? 'Crear activo'
                : 'Guardar cambios'}
          </button>
        </form>
      )}

      <section
        aria-label="Filtros de activos"
        className="grid gap-3 rounded-2xl border border-grafito-200 bg-white p-4 shadow-panel md:grid-cols-[1fr_220px_220px]"
      >
        <label className="text-xs font-semibold text-grafito-500">
          Buscar equipo
          <input
            value={search}
            onChange={(event) => updateFilter('buscar', event.target.value)}
            placeholder="Código, tipo, marca, modelo o serie"
            className="mt-1.5 w-full rounded-xl border border-grafito-200 px-3 py-2.5 text-sm text-marino-900 outline-none focus:border-turquesa-500"
          />
        </label>
        <SelectField
          label="Estado"
          value={estado}
          onChange={(value) => updateFilter('estado', value)}
          options={Object.values(AssetStatus).map((value) => ({
            value,
            label: ASSET_ESTADO_LABELS[value],
          }))}
          empty="Todos los estados"
        />
        <SelectField
          label="Sucursal"
          value={locationId}
          onChange={(value) => updateFilter('locationId', value)}
          options={(locationsQuery.data ?? []).map((item) => ({
            value: item.id,
            label: item.nombre,
          }))}
          empty="Todas las sucursales"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-grafito-200 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-grafito-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-marino-950">Inventario operativo</h2>
            <p className="text-xs text-grafito-500">
              {filteredAssets.length} de {assets.length} equipos visibles
            </p>
          </div>
          {locationId && (
            <Link
              to={`/dashboard?rango=30d&locationId=${encodeURIComponent(locationId)}`}
              className="text-xs font-semibold text-turquesa-700 hover:text-turquesa-800"
            >
              Ver pulso de esta sucursal →
            </Link>
          )}
        </div>
        {assetsQuery.isLoading && (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-grafito-100" />
            ))}
          </div>
        )}
        {assetsQuery.isError && (
          <p className="p-6 text-sm text-red-600">No se pudieron cargar los activos.</p>
        )}
        {!assetsQuery.isLoading && !assetsQuery.isError && filteredAssets.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-semibold text-marino-900">No hay activos con estos filtros</p>
            <p className="mt-1 text-sm text-grafito-500">
              Probá cambiando la búsqueda, el estado o la sucursal.
            </p>
          </div>
        )}
        {filteredAssets.length > 0 && (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-grafito-100 text-xs uppercase tracking-wide text-grafito-500">
                  <tr>
                    <th className="px-4 py-3">Identidad</th>
                    <th className="px-4 py-3">Equipo</th>
                    <th className="px-4 py-3">Sucursal</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Salud estimada</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grafito-200">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-grafito-100/60">
                      <td className="px-4 py-3">
                        <Link
                          to={`/activos/${asset.id}`}
                          className="font-mono text-xs font-bold text-marino-800 hover:text-turquesa-700"
                        >
                          {asset.codigoInterno}
                        </Link>
                        <p className="mt-1 font-mono text-[10px] text-grafito-400">
                          {asset.publicAssetCode}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/activos/${asset.id}`}
                          className="font-semibold text-marino-900 hover:text-turquesa-700"
                        >
                          {asset.tipo}
                        </Link>
                        <p className="text-xs text-grafito-500">
                          {[asset.marca, asset.modelo].filter(Boolean).join(' ') ||
                            'Sin marca/modelo'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-grafito-600">{asset.location.nombre}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${ESTADO_CLASSES[asset.estado]}`}
                        >
                          {ASSET_ESTADO_LABELS[asset.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/activos/${asset.id}`} className="block min-w-32">
                          <span className="flex items-center justify-between text-[10px] font-semibold text-grafito-500">
                            <span>{assetHealth(asset).label}</span>
                            <strong className="text-marino-900">{assetHealth(asset).score}</strong>
                          </span>
                          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-grafito-100">
                            <span
                              className={`block h-full rounded-full ${assetHealth(asset).tone}`}
                              style={{ width: `${assetHealth(asset).score}%` }}
                            />
                          </span>
                          <span className="mt-1 block text-[9px] text-grafito-400">
                            {asset._count.tickets} incidencias
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <Link
                            to={`/activos/${asset.id}`}
                            className="text-xs font-semibold text-marino-700 hover:underline"
                          >
                            Ficha
                          </Link>
                          {puedeAdministrar && (
                            <button
                              type="button"
                              onClick={() => openEdit(asset)}
                              className="text-xs font-semibold text-turquesa-700"
                            >
                              Editar
                            </button>
                          )}
                          <a
                            href={getAssetQrUrl(asset.publicAssetCode)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-marino-700 hover:underline"
                          >
                            Ver QR
                          </a>
                          <Link
                            to={`/tickets?assetId=${asset.id}&assetCode=${encodeURIComponent(asset.codigoInterno)}`}
                            className="text-xs font-semibold text-marino-700 hover:underline"
                          >
                            Tickets
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
              {filteredAssets.map((asset) => (
                <article key={asset.id} className="rounded-xl border border-grafito-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/activos/${asset.id}`}
                        className="font-mono text-xs font-bold text-marino-800"
                      >
                        {asset.codigoInterno}
                      </Link>
                      <h3 className="mt-1 font-semibold text-marino-950">{asset.tipo}</h3>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${ESTADO_CLASSES[asset.estado]}`}
                    >
                      {ASSET_ESTADO_LABELS[asset.estado]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-grafito-500">
                    {[asset.marca, asset.modelo].filter(Boolean).join(' ') || 'Sin marca/modelo'} ·{' '}
                    {asset.location.nombre}
                  </p>
                  <div className="mt-4 rounded-xl bg-grafito-100/70 p-3">
                    <span className="flex items-center justify-between text-[10px] font-semibold text-grafito-500">
                      <span>Salud · {assetHealth(asset).label}</span>
                      <strong className="text-marino-950">{assetHealth(asset).score}/100</strong>
                    </span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white">
                      <span
                        className={`block h-full rounded-full ${assetHealth(asset).tone}`}
                        style={{ width: `${assetHealth(asset).score}%` }}
                      />
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-grafito-200 pt-3">
                    <Link
                      to={`/activos/${asset.id}`}
                      className="text-xs font-semibold text-marino-700"
                    >
                      Ver ficha
                    </Link>
                    {puedeAdministrar && (
                      <button
                        type="button"
                        onClick={() => openEdit(asset)}
                        className="text-xs font-semibold text-turquesa-700"
                      >
                        Editar
                      </button>
                    )}
                    <a
                      href={getAssetQrUrl(asset.publicAssetCode)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-marino-700"
                    >
                      QR
                    </a>
                    <Link
                      to={`/tickets?assetId=${asset.id}&assetCode=${encodeURIComponent(asset.codigoInterno)}`}
                      className="text-xs font-semibold text-marino-700"
                    >
                      {asset._count.tickets} tickets
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function AssetMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-grafito-200 bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-grafito-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-marino-950">{value}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${tone}`} />
      </div>
      <p className="mt-1 text-xs text-grafito-500">{detail}</p>
    </article>
  );
}
function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-xs font-semibold text-grafito-600">
      {label}
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-grafito-200 bg-white px-3 py-2.5 text-sm font-medium text-marino-900 outline-none focus:border-turquesa-500"
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
  empty,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  empty?: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-semibold text-grafito-600">
      {label}
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-grafito-200 bg-white px-3 py-2.5 text-sm font-medium text-marino-900 outline-none focus:border-turquesa-500"
      >
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
