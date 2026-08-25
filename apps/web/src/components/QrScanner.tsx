import type { IScannerControls } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';

function extraerCodigo(valor: string): string {
  const limpio = valor.trim();
  try {
    const url = new URL(limpio);
    const segmentos = url.pathname.split('/').filter(Boolean);
    const indiceReportar = segmentos.indexOf('reportar');
    const codigoEnRuta = segmentos[indiceReportar + 1];
    if (indiceReportar >= 0 && codigoEnRuta) return decodeURIComponent(codigoEnRuta);
    return url.searchParams.get('activo') ?? limpio;
  } catch {
    return limpio;
  }
}

export function QrScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detener = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setAbierto(false);
  };

  useEffect(() => () => controlsRef.current?.stop(), []);

  useEffect(() => {
    if (!abierto || !videoRef.current) return;
    let cancelado = false;
    const iniciar = async () => {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      if (cancelado || !videoRef.current) return;
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (resultado) => {
          if (!resultado || cancelado) return;
          const codigo = extraerCodigo(resultado.getText());
          if (codigo.length < 2) {
            setError('El QR no contiene un codigo de activo valido.');
            return;
          }
          onDetected(codigo);
          detener();
        },
      );
      if (cancelado) controls.stop();
      else controlsRef.current = controls;
    };
    void iniciar().catch(() => {
      if (!cancelado) {
        setError('No se pudo abrir la camara. Revisa el permiso o ingresa el codigo manualmente.');
        setAbierto(false);
      }
    });
    return () => {
      cancelado = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [abierto, onDetected]);

  return (
    <div className="mt-3">
      {!abierto ? (
        <button type="button" onClick={() => { setError(null); setAbierto(true); }} className="inline-flex items-center gap-2 rounded-xl bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-marino-900">
          <span aria-hidden="true">▣</span> Escanear QR con la camara
        </button>
      ) : (
        <div className="overflow-hidden rounded-xl border border-turquesa-500/30 bg-marino-950 p-3">
          <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-lg bg-black object-cover" aria-label="Vista de la camara para escanear QR" />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-marino-200">Apunta la camara a la etiqueta QR del equipo.</p>
            <button type="button" onClick={detener} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white">Cancelar</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
