import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const FLOW = [
  {
    label: 'Escanear',
    detail: 'El QR identifica el activo, la sede y todo su historial.',
    icon: '⌁',
  },
  { label: 'Priorizar', detail: 'El impacto y el contexto definen prioridad y SLA.', icon: '◇' },
  { label: 'Resolver', detail: 'Soporte recibe una próxima acción clara y trazable.', icon: '✓' },
  { label: 'Aprender', detail: 'Cada resolución mejora la lectura de la operación.', icon: '↗' },
];

const DEMO_STEPS = [
  {
    kicker: '01 · Identidad inmediata',
    title: 'Un QR convierte el equipo en contexto.',
    copy: 'La persona no necesita conocer números de inventario ni completar datos técnicos. El activo y su sede ya están vinculados.',
    status: 'Activo identificado',
    asset: 'IMP-001',
    meta: 'HP LaserJet Pro · Recepción',
  },
  {
    kicker: '02 · Triaje automático',
    title: 'El reporte llega ordenado, no sólo enviado.',
    copy: 'Impacto, interrupción y señales de riesgo producen una prioridad consistente y un SLA visible para todo el equipo.',
    status: 'Prioridad alta',
    asset: 'SLA · 8 horas',
    meta: 'Impresión · Sin alternativa',
  },
  {
    kicker: '03 · Operación accionable',
    title: 'La próxima decisión aparece antes que el ruido.',
    copy: 'El dashboard combina criticidad, asignación y tiempo sin actividad para señalar dónde actuar primero.',
    status: 'Acción recomendada',
    asset: 'Asignar a Martín',
    meta: 'Carga disponible · 3 casos',
  },
  {
    kicker: '04 · Memoria técnica',
    title: 'La resolución queda unida al activo.',
    copy: 'Responsables, diagnóstico, adjuntos y tiempos forman un historial auditable que ayuda a detectar recurrencias.',
    status: 'Circuito cerrado',
    asset: 'Historial actualizado',
    meta: 'Trazabilidad completa',
  },
];

const STACK = [
  'React + TypeScript',
  'Express + Prisma',
  'PostgreSQL',
  'Cloudflare R2 privado',
  'Playwright E2E',
  'CI/CD + backups',
];

function BrandMark() {
  return (
    <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-turquesa-400 text-[11px] font-black text-marino-950 shadow-[0_0_30px_rgba(63,224,208,.25)]">
      <span className="absolute left-1.5 top-1.5 h-2 w-2 border-l-2 border-t-2 border-marino-950" />
      <span className="absolute bottom-1.5 right-1.5 h-2 w-2 border-b-2 border-r-2 border-marino-950" />
      QR
    </span>
  );
}

function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const step = DEMO_STEPS[activeStep] ?? DEMO_STEPS[0]!;

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveStep((current) => (current + 1) % DEMO_STEPS.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-marino-950 text-white selection:bg-turquesa-400 selection:text-marino-950">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-marino-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#inicio" className="flex items-center gap-3">
            <BrandMark />
            <span>
              <span className="block text-sm font-bold tracking-tight">SoporteQR</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-marino-300">
                Inteligencia para cada activo
              </span>
            </span>
          </a>
          <div className="hidden items-center gap-7 text-xs font-semibold text-marino-200 md:flex">
            <a href="#producto" className="transition hover:text-white">
              Producto
            </a>
            <a href="#demo" className="transition hover:text-white">
              Demo guiada
            </a>
            <a href="#arquitectura" className="transition hover:text-white">
              Arquitectura
            </a>
          </div>
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-bold transition hover:border-turquesa-400/50 hover:bg-turquesa-400 hover:text-marino-950"
          >
            Entrar a la demo{' '}
            <span className="transition-transform group-hover:translate-x-0.5">
              <Arrow />
            </span>
          </Link>
        </div>
      </nav>

      <section
        id="inicio"
        className="relative min-h-[920px] px-5 pb-24 pt-36 sm:px-8 lg:px-12 lg:pt-44"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(31,199,182,.16),transparent_27%),radial-gradient(circle_at_15%_30%,rgba(47,74,122,.34),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div className="relative mx-auto grid max-w-[90rem] items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-turquesa-400/20 bg-turquesa-400/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-turquesa-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-turquesa-400 opacity-50" />
                <span className="relative h-2 w-2 rounded-full bg-turquesa-400" />
              </span>
              Activos que hablan con soporte
            </div>
            <h1 className="mt-7 max-w-4xl text-[clamp(3.3rem,7.2vw,7.7rem)] font-semibold leading-[.88] tracking-[-.065em]">
              Un QR.
              <br />
              <span className="bg-gradient-to-r from-turquesa-300 via-turquesa-400 to-sky-400 bg-clip-text text-transparent">
                Todo el contexto.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-marino-200 sm:text-lg">
              SoporteQR transforma cada equipo en su propio canal de asistencia: identifica,
              prioriza y conecta la incidencia con una operación técnica medible.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#demo"
                className="group inline-flex items-center gap-3 rounded-full bg-turquesa-400 px-6 py-3.5 text-sm font-black text-marino-950 transition hover:-translate-y-0.5 hover:bg-turquesa-300"
              >
                Ver cómo funciona{' '}
                <span className="transition-transform group-hover:translate-x-1">
                  <Arrow />
                </span>
              </a>
              <Link
                to="/login"
                className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Explorar producto
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6 text-xs text-marino-300">
              <span>
                <strong className="mr-2 text-white">3</strong>roles conectados
              </span>
              <span>
                <strong className="mr-2 text-white">100%</strong>trazable
              </span>
              <span>
                <strong className="mr-2 text-white">24/7</strong>operación visible
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:translate-y-5">
            <div className="absolute -inset-8 rounded-full bg-turquesa-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07101e]/95 shadow-[0_40px_100px_-30px_rgba(0,0,0,.8)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[.2em] text-marino-300">
                  Live operation / AR-CBA-01
                </span>
              </div>
              <div className="grid min-h-[490px] md:grid-cols-[150px_1fr]">
                <aside className="hidden border-r border-white/[0.08] p-4 md:block">
                  <div className="mb-8 flex items-center gap-2">
                    <BrandMark />
                    <span className="text-xs font-bold">SoporteQR</span>
                  </div>
                  {['Pulso', 'Tickets', 'Activos', 'Auditoría'].map((item, index) => (
                    <div
                      key={item}
                      className={`mb-1 rounded-lg px-3 py-2.5 text-[11px] font-semibold ${index === 0 ? 'bg-turquesa-400/10 text-turquesa-300' : 'text-marino-300'}`}
                    >
                      {item}
                    </div>
                  ))}
                </aside>
                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[.22em] text-turquesa-300">
                        Pulso operativo
                      </p>
                      <h2 className="mt-2 text-xl font-semibold">Lo que necesita una decisión</h2>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300">
                      ● EN VIVO
                    </span>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <Metric value="87" label="Índice de control" suffix="" />
                    <Metric value="04" label="En riesgo" warning />
                    <Metric value="91" label="Dentro de SLA" suffix="%" />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1.12fr_.88fr]">
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
                      <div className="absolute right-0 top-0 h-32 w-32 bg-turquesa-400/10 blur-3xl" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-marino-300">
                        Radar de riesgo
                      </p>
                      <div className="mt-5 flex items-center gap-5">
                        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-[conic-gradient(#3fe0d0_313deg,rgba(255,255,255,.07)_0)] p-1">
                          <div className="grid h-full w-full place-items-center rounded-full bg-marino-950 text-center">
                            <span>
                              <strong className="block text-3xl">87</strong>
                              <small className="text-[8px] text-marino-300">CONTROL</small>
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3 text-[10px]">
                          <Signal color="bg-red-400" value="1" label="Crítico abierto" />
                          <Signal color="bg-amber-400" value="2" label="Sin responsable" />
                          <Signal color="bg-violet-400" value="1" label="Caso estancado" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-turquesa-400 p-5 text-marino-950">
                      <p className="text-[10px] font-black uppercase tracking-wider">
                        Próxima acción
                      </p>
                      <p className="mt-6 text-3xl font-semibold tracking-tight">Asignar</p>
                      <p className="mt-1 text-xs font-bold">SOP-2026-0042</p>
                      <p className="mt-4 text-[10px] leading-4 opacity-70">
                        Terminal de recepción sin red · Sede Centro
                      </p>
                      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-marino-950/15">
                        <div className="h-full w-4/5 rounded-full bg-marino-950" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-marino-200">Demanda vs. capacidad</span>
                      <span className="text-emerald-300">+12% eficiencia</span>
                    </div>
                    <div className="mt-5 flex h-20 items-end gap-2">
                      {[36, 54, 42, 70, 58, 86, 68, 92, 77, 96, 82, 100].map((height, index) => (
                        <span
                          key={index}
                          className="flex-1 rounded-t-sm bg-gradient-to-t from-turquesa-600/50 to-turquesa-300"
                          style={{ height: `${height}%`, opacity: 0.45 + index / 24 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-5 hidden items-center gap-3 rounded-2xl border border-white/10 bg-marino-900/95 p-4 shadow-2xl backdrop-blur sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
                ✓
              </span>
              <span>
                <strong className="block text-xs">Activo identificado</strong>
                <small className="text-[10px] text-marino-300">en menos de un segundo</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="producto"
        className="relative border-y border-white/[0.07] bg-[#08111f] px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
      >
        <div className="mx-auto max-w-[90rem]">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-turquesa-300">
                Una cadena completa
              </p>
              <h2 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-5xl">
                Del objeto físico a una decisión operativa.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-marino-200">
                No es otro formulario de soporte. Cada paso conserva el contexto que normalmente se
                pierde entre mensajes, planillas y llamadas.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
              {FLOW.map((item, index) => (
                <article
                  key={item.label}
                  className="group bg-marino-950 p-7 transition hover:bg-marino-900 sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-xl text-turquesa-300 transition group-hover:border-turquesa-400/30 group-hover:bg-turquesa-400/10">
                      {item.icon}
                    </span>
                    <span className="font-mono text-[10px] text-grafito-500">0{index + 1}</span>
                  </div>
                  <h3 className="mt-10 text-xl font-semibold">{item.label}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-marino-300">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="demo"
        className="bg-grafito-100 px-5 py-24 text-marino-950 sm:px-8 lg:px-12 lg:py-32"
      >
        <div className="mx-auto max-w-[90rem]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-turquesa-600">
              Demo guiada · 90 segundos
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-.045em] sm:text-6xl">
              El circuito completo, sin perder el hilo.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-grafito-500">
              Recorré la lógica del producto antes de entrar. Cada etapa muestra qué información
              aparece y qué decisión habilita.
            </p>
          </div>
          <div className="mt-14 overflow-hidden rounded-[2rem] border border-grafito-200 bg-white shadow-[0_30px_90px_-45px_rgba(5,11,22,.35)] lg:grid lg:grid-cols-[.78fr_1.22fr]">
            <div className="border-b border-grafito-200 p-5 lg:border-b-0 lg:border-r lg:p-8">
              <p className="px-3 text-[10px] font-black uppercase tracking-[.2em] text-grafito-400">
                Recorrido del sistema
              </p>
              <div className="mt-5 space-y-2">
                {DEMO_STEPS.map((item, index) => (
                  <button
                    key={item.kicker}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`w-full rounded-2xl p-4 text-left transition sm:p-5 ${activeStep === index ? 'bg-marino-950 text-white shadow-xl' : 'text-grafito-500 hover:bg-grafito-100'}`}
                  >
                    <span className="flex items-center gap-4">
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${activeStep === index ? 'bg-turquesa-400 text-marino-950' : 'border border-grafito-200 bg-white text-grafito-500'}`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>
                        <strong
                          className={`block text-sm ${activeStep === index ? 'text-white' : 'text-marino-950'}`}
                        >
                          {item.title}
                        </strong>
                        <small className="mt-1 block text-[10px]">{item.kicker}</small>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="relative min-h-[570px] overflow-hidden bg-marino-950 p-6 text-white sm:p-10 lg:p-12">
              <div className="absolute inset-0 opacity-[.11] [background-image:linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:40px_40px]" />
              <div className="relative flex h-full flex-col">
                <div>
                  <span className="inline-flex rounded-full border border-turquesa-400/20 bg-turquesa-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-turquesa-300">
                    {step.status}
                  </span>
                  <h3 className="mt-6 max-w-xl text-3xl font-semibold tracking-[-.035em] sm:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-marino-200">{step.copy}</p>
                </div>
                <div className="mt-auto pt-12">
                  <div className="relative mx-auto max-w-lg">
                    <div className="absolute -inset-10 bg-turquesa-400/10 blur-3xl" />
                    <div className="relative rounded-[1.8rem] border border-white/10 bg-white/[.05] p-6 backdrop-blur">
                      <div className="flex items-center gap-5">
                        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-white p-3">
                          <div className="grid h-full w-full grid-cols-5 gap-1">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <span
                                key={i}
                                className={`${[0, 1, 2, 5, 7, 10, 11, 12, 14, 17, 19, 20, 21, 22, 24].includes(i) ? 'bg-marino-950' : 'bg-white'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-turquesa-300">
                            SoporteQR / live
                          </p>
                          <strong className="mt-2 block text-2xl">{step.asset}</strong>
                          <p className="mt-2 text-xs text-marino-300">{step.meta}</p>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-[10px] text-marino-300">
                          Paso {activeStep + 1} de {DEMO_STEPS.length}
                        </span>
                        <span className="flex gap-1.5">
                          {DEMO_STEPS.map((_, index) => (
                            <button
                              aria-label={`Ir al paso ${index + 1}`}
                              key={index}
                              onClick={() => setActiveStep(index)}
                              className={`h-1.5 rounded-full transition-all ${activeStep === index ? 'w-8 bg-turquesa-400' : 'w-1.5 bg-white/20'}`}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="arquitectura" className="relative px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(31,199,182,.09),transparent_35%)]" />
        <div className="relative mx-auto max-w-[90rem]">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-turquesa-300">
                Más que una interfaz
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
                Construido para que lo visible tenga respaldo.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-marino-200">
                Permisos aplicados también en backend, adjuntos privados, auditoría, base
                relacional, pruebas verticales y backups que se restauran antes de guardarse.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {STACK.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-marino-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[.035] p-6 sm:p-9">
              <div className="grid gap-3">
                <ArchitectureRow
                  label="Experiencia"
                  value="React · TypeScript · Vercel"
                  number="01"
                />
                <ArchitectureRow label="Servicios" value="Express · Prisma · Railway" number="02" />
                <ArchitectureRow label="Datos" value="PostgreSQL · Cloudflare R2" number="03" />
                <ArchitectureRow label="Confianza" value="RBAC · E2E · CI · Backups" number="04" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-turquesa-400 px-5 py-20 text-marino-950 sm:px-8">
        <div className="mx-auto flex max-w-[90rem] flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] opacity-60">
              Demo pública · Datos ficticios
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
              No te quedes con la presentación. Probá la operación.
            </h2>
          </div>
          <Link
            to="/login"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-marino-950 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            Explorar los 3 perfiles{' '}
            <span className="transition-transform group-hover:translate-x-1">
              <Arrow />
            </span>
          </Link>
        </div>
      </section>

      <footer className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-5 text-xs text-marino-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span>
              <strong className="block text-white">SoporteQR</strong>
              <span>Activos e incidencias conectados</span>
            </span>
          </div>
          <p>
            Diseñado y desarrollado por{' '}
            <a
              className="font-bold text-white hover:text-turquesa-300"
              href="https://www.linkedin.com/in/cristian-eduardo-alba-374098240/"
              target="_blank"
              rel="noreferrer"
            >
              Cristian Eduardo Alba
            </a>{' '}
            · Córdoba, Argentina
          </p>
        </div>
      </footer>
    </main>
  );
}

function Metric({
  value,
  label,
  suffix = '',
  warning = false,
}: {
  value: string;
  label: string;
  suffix?: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${warning ? 'border-red-300/10 bg-red-300/[.06]' : 'border-white/[.07] bg-white/[.035]'}`}
    >
      <p className={`text-xl font-semibold ${warning ? 'text-red-300' : 'text-white'}`}>
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-[8px] uppercase tracking-wider text-marino-300">{label}</p>
    </div>
  );
}
function Signal({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <strong className="w-3 text-white">{value}</strong>
      <span className="text-marino-300">{label}</span>
    </div>
  );
}
function ArchitectureRow({
  label,
  value,
  number,
}: {
  label: string;
  value: string;
  number: string;
}) {
  return (
    <div className="group flex items-center gap-5 rounded-2xl border border-white/[.07] bg-marino-950/60 p-5 transition hover:border-turquesa-400/25 hover:bg-marino-900">
      <span className="font-mono text-[10px] text-turquesa-300">{number}</span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm text-white">{label}</strong>
        <span className="mt-1 block text-xs text-marino-300">{value}</span>
      </span>
      <span className="text-marino-500 transition-transform group-hover:translate-x-1 group-hover:text-turquesa-300">
        <Arrow />
      </span>
    </div>
  );
}
