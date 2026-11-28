/** Marco sencillo con la marca del negocio para las páginas de turnos y menú. */
export default function BizShell({ name, subtitle, logoUrl, color, children }: { name: string; subtitle?: string; logoUrl?: string; color: string; children: React.ReactNode }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="relative min-h-dvh overflow-hidden bg-paper">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-25 blur-3xl" style={{ background: color }} />
      <div className="relative mx-auto max-w-md px-5 pb-10 pt-10">
        <header className="flex flex-col items-center text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="h-20 w-20 rounded-full object-cover shadow-lg ring-4 ring-paper" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full text-2xl font-semibold text-white shadow-lg" style={{ background: color }}>{initials}</span>
          )}
          <h1 className="mt-4 font-display text-3xl text-ink-900">{name}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </header>
        <div className="mt-8">{children}</div>
        <a href="https://aldore.co" className="mt-12 flex items-center justify-center gap-1.5 text-[11px] text-ink-400 hover:text-ink-700">
          <svg viewBox="0 0 40 40" className="h-3 w-3" aria-hidden="true">
            <path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="currentColor" />
            <path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill="#e2471c" />
          </svg>
          Hecho por Aldore
        </a>
      </div>
    </div>
  );
}
