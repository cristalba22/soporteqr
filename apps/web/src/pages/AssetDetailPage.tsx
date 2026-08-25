import { AssetStatus } from '@soporteqr/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { getAsset, getAssetQrDownloadUrl, getAssetQrUrl } from '../lib/api';
import { ASSET_ESTADO_LABELS, ESTADO_CLASSES, ESTADO_LABELS, PRIORIDAD_CLASSES, PRIORIDAD_LABELS, formatFecha } from '../lib/labels';

const ASSET_TONES: Record<AssetStatus, string> = {
  [AssetStatus.ACTIVO]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  [AssetStatus.EN_REPARACION]: 'border-amber-200 bg-amber-50 text-amber-700',
  [AssetStatus.DE_BAJA]: 'border-red-200 bg-red-50 text-red-700',
  [AssetStatus.EN_DEPOSITO]: 'border-grafito-200 bg-grafito-100 text-grafito-600',
};

function fechaCorta(value: string | null): string {
  if (!value) return 'Sin registrar';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(value));
}

export function AssetDetailPage() {
  const { id = '' } = useParams();
  const assetQuery = useQuery({ queryKey: ['asset', id], queryFn: () => getAsset(id), enabled: Boolean(id) });

  if (assetQuery.isLoading) {
    return <div className="space-y-4"><div className="h-36 animate-pulse rounded-3xl bg-marino-900" /><div className="h-72 animate-pulse rounded-2xl bg-white" /></div>;
  }

  if (assetQuery.isError || !assetQuery.data) {
    return <section className="rounded-2xl border border-red-200 bg-white p-8 text-center"><h1 className="font-semibold text-marino-950">No pudimos abrir este activo</h1><p className="mt-2 text-sm text-grafito-500">Verificá que exista y que pertenezca a tu organización.</p><Link to="/activos" className="mt-5 inline-flex rounded-xl bg-marino-950 px-4 py-2 text-sm font-semibold text-white">Volver al inventario</Link></section>;
  }

  const asset = assetQuery.data;
  const descriptor = [asset.marca, asset.modelo].filter(Boolean).join(' ') || 'Marca y modelo sin registrar';

  return (
    <div className="space-y-5 pb-10">
      <Link to="/activos" className="inline-flex items-center gap-2 text-sm font-semibold text-grafito-500 hover:text-marino-950">← Volver a activos</Link>

      <header className="overflow-hidden rounded-3xl bg-marino-950 text-white shadow-panel">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-turquesa-500/15 px-3 py-1 font-mono text-xs font-bold text-turquesa-300">{asset.codigoInterno}</span><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${ASSET_TONES[asset.estado]}`}>{ASSET_ESTADO_LABELS[asset.estado]}</span></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-marino-300">Identidad operativa</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{asset.tipo}</h1>
            <p className="mt-2 text-sm text-marino-200">{descriptor} · {asset.location.nombre}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/?assetId=${asset.id}&assetCode=${encodeURIComponent(asset.codigoInterno)}`} className="rounded-xl border border-marino-600 px-4 py-2.5 text-sm font-semibold hover:border-turquesa-400">Ver tickets</Link>
            <Link to={`/tickets/nuevo?activo=${encodeURIComponent(asset.publicAssetCode)}`} className="rounded-xl bg-turquesa-500 px-4 py-2.5 text-sm font-semibold text-marino-950 hover:bg-turquesa-400">Crear incidencia</Link>
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-grafito-200 bg-white p-5 shadow-panel sm:p-6">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-grafito-500">Ficha técnica</p><h2 className="mt-1 text-lg font-semibold text-marino-950">Datos del equipo</h2></div>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Dato label="Código interno" value={asset.codigoInterno} mono />
              <Dato label="Código público" value={asset.publicAssetCode} mono />
              <Dato label="Número de serie" value={asset.numeroSerie ?? 'Sin registrar'} />
              <Dato label="Marca" value={asset.marca ?? 'Sin registrar'} />
              <Dato label="Modelo" value={asset.modelo ?? 'Sin registrar'} />
              <Dato label="Ubicación" value={asset.location.nombre} />
              <Dato label="Fecha de adquisición" value={fechaCorta(asset.fechaAdquisicion)} />
              <Dato label="Último mantenimiento" value={fechaCorta(asset.ultimoMantenimiento)} />
              <Dato label="Incidencias totales" value={String(asset._count.tickets)} />
            </dl>
            {asset.notas && <div className="mt-6 rounded-xl bg-grafito-100 p-4"><p className="text-xs font-semibold text-grafito-500">Notas técnicas</p><p className="mt-1 text-sm text-marino-900">{asset.notas}</p></div>}
          </section>

          <section className="overflow-hidden rounded-2xl border border-grafito-200 bg-white shadow-panel">
            <div className="flex items-end justify-between border-b border-grafito-200 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-grafito-500">Trazabilidad</p><h2 className="mt-1 text-lg font-semibold text-marino-950">Historial de tickets</h2></div><span className="text-xs text-grafito-500">Últimos 20</span></div>
            {asset.tickets.length === 0 ? <div className="p-8 text-center"><p className="font-semibold text-marino-900">Este activo todavía no tiene incidencias</p><p className="mt-1 text-sm text-grafito-500">Su historial aparecerá aquí desde el primer reporte.</p></div> : <div className="divide-y divide-grafito-200">{asset.tickets.map((ticket) => <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-grafito-100/70 sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className="font-mono text-xs font-bold text-marino-700">{ticket.numero}</span><div><p className="text-sm font-semibold text-marino-950">{ticket.titulo}</p><p className="mt-1 text-xs text-grafito-500">{formatFecha(ticket.createdAt)}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${PRIORIDAD_CLASSES[ticket.prioridad]}`}>{PRIORIDAD_LABELS[ticket.prioridad]}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${ESTADO_CLASSES[ticket.estado]}`}>{ESTADO_LABELS[ticket.estado]}</span></div></Link>)}</div>}
          </section>
        </div>

        <aside className="space-y-4">
          <section id="etiqueta-qr" className="rounded-2xl border border-grafito-300 bg-white p-6 text-center shadow-panel">
            <div className="flex items-center justify-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marino-950 text-[10px] font-bold text-turquesa-300">QR</span><span className="font-bold text-marino-950">SoporteQR</span></div>
            <img src={getAssetQrUrl(asset.publicAssetCode)} alt={`Código QR del activo ${asset.codigoInterno}`} className="mx-auto mt-4 aspect-square w-52 max-w-full" />
            <p className="mt-3 font-mono text-lg font-bold text-marino-950">{asset.codigoInterno}</p>
            <p className="text-sm font-semibold text-grafito-600">{asset.tipo} · {asset.location.nombre}</p>
            <p className="mt-3 text-[11px] text-grafito-500">Escaneá para reportar una incidencia</p>
          </section>
          <div className="grid grid-cols-2 gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-xl bg-marino-950 px-3 py-2.5 text-sm font-semibold text-white hover:bg-marino-800">Imprimir etiqueta</button><a href={getAssetQrDownloadUrl(asset.publicAssetCode)} className="rounded-xl border border-grafito-300 bg-white px-3 py-2.5 text-center text-sm font-semibold text-marino-900 hover:border-turquesa-500">Descargar QR</a></div>
          <p className="rounded-xl border border-turquesa-200 bg-turquesa-50 p-4 text-xs leading-5 text-turquesa-700">La etiqueta abre el reporte público del equipo. No muestra credenciales ni información sensible.</p>
        </aside>
      </div>
    </div>
  );
}

function Dato({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-xs font-semibold text-grafito-500">{label}</dt><dd className={`mt-1 text-sm font-semibold text-marino-950 ${mono ? 'font-mono' : ''}`}>{value}</dd></div>;
}
