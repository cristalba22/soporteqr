import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';

interface AssetPublico {
  codigoInterno: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  location: { nombre: string };
}

export function ReportarPage() {
  const { publicAssetCode = '' } = useParams();
  const { user, cargando } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['asset-publico', publicAssetCode],
    queryFn: () => api.get<{ asset: AssetPublico }>(`/api/assets/publico/${publicAssetCode}`),
    enabled: publicAssetCode.length > 0,
    retry: false,
  });

  const destinoTicket = `/tickets/nuevo?activo=${encodeURIComponent(publicAssetCode)}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-grafito-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-grafito-200 bg-white p-6 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-wide text-turquesa-600">SoporteQR</p>
        <h1 className="mt-1 text-xl font-semibold text-marino-950">Reportar incidencia</h1>

        {isLoading && <p className="mt-4 text-sm text-grafito-500">Buscando activo...</p>}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error instanceof ApiError ? error.message : 'Activo no encontrado'}
          </p>
        )}

        {data && (
          <div className="mt-4 rounded-lg bg-grafito-100 px-3 py-2.5 text-sm text-marino-900">
            <p className="font-semibold">
              {data.asset.tipo} {data.asset.marca ?? ''} {data.asset.modelo ?? ''}
            </p>
            <p className="text-xs text-grafito-500">{data.asset.location.nombre}</p>
          </div>
        )}

        {data && !cargando && (
          <div className="mt-6">
            {user ? (
              <Link
                to={destinoTicket}
                className="block w-full rounded-lg bg-turquesa-500 px-4 py-2.5 text-center text-sm font-semibold text-marino-950 transition-colors hover:bg-turquesa-400"
              >
                Crear ticket para este activo
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ from: { pathname: destinoTicket } }}
                className="block w-full rounded-lg bg-marino-950 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-marino-900"
              >
                Iniciar sesion para reportar
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
