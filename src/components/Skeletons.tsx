import { Logo } from "./Logo";

// Esqueletos de carregamento: aparecem no mesmo instante do clique, no formato da página
// que está chegando, para a navegação nunca parecer travada.

const bar = "rounded-md bg-mist/60";
const box = "rounded-panel border border-mist/60 bg-casco/60";

function Busy({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={`motion-safe:animate-pulse ${className}`}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className={`${box} p-5`}>
      <div className="flex gap-3"><div className="h-11 w-11 shrink-0 rounded-xl bg-mist/60" /><div className="flex-1 space-y-2"><div className={`${bar} h-4 w-3/4`} /><div className={`${bar} h-3 w-1/3`} /></div></div>
      <div className={`${bar} mt-5 h-3 w-2/3`} />
      <div className={`${bar} mt-3 h-3 w-1/3`} />
      <div className="mt-5 flex gap-2"><div className={`${bar} h-6 w-16`} /><div className={`${bar} h-6 w-20`} /><div className={`${bar} h-6 w-14`} /></div>
    </div>
  );
}

/** Conteúdo das páginas públicas (o menu e o rodapé continuam na tela). */
export function SiteSkeleton() {
  return (
    <Busy label="Carregando página" className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className={`${bar} h-10 w-1/2 max-w-md`} />
      <div className={`${bar} mt-4 h-4 w-2/3 max-w-xl`} />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
    </Busy>
  );
}

/** Lista de vagas: cabeçalho, filtros à esquerda e cartões. */
export function JobsSkeleton() {
  return (
    <Busy label="Carregando vagas" className="w-full">
      <div className="border-b border-mist/60"><div className="mx-auto max-w-6xl px-4 py-12"><div className={`${bar} h-10 w-40`} /><div className={`${bar} mt-4 h-4 w-2/3 max-w-xl`} /><div className="mt-6 flex gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 w-28 rounded-full bg-mist/50" />)}</div></div></div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
        <div className={`${box} h-96`} />
        <div className="grid gap-4">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      </div>
    </Busy>
  );
}

/** Conteúdo das áreas logadas (a barra lateral continua na tela). */
export function AreaSkeleton() {
  return (
    <Busy label="Carregando">
      <div className={`${bar} mb-6 h-8 w-56`} />
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className={`${box} h-[104px]`} />)}</div>
      <div className={`${bar} mb-3 mt-8 h-5 w-64`} />
      <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <CardSkeleton key={i} />)}</div>
    </Busy>
  );
}

/** Troca de moldura (ex.: do site público para o painel): cabeçalho fixo e conteúdo. */
export function FullSkeleton() {
  return (
    <>
      <header className="border-b border-mist/70 bg-fossa/80"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><Logo /><div className="h-11 w-11 rounded-full bg-mist/50" /></div></header>
      <SiteSkeleton />
    </>
  );
}
