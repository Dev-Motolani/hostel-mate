type PageSkeletonProps = {
  cards?: number;
  detail?: boolean;
};

export function PageSkeleton({ cards = 3, detail = false }: PageSkeletonProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-7 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-11 max-w-xl rounded bg-slate-200" />
        <div className="mt-3 h-5 max-w-2xl rounded bg-slate-200" />
        {detail ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"><div><div className="h-80 rounded-3xl bg-slate-200" /><div className="mt-8 h-8 w-2/3 rounded bg-slate-200" /><div className="mt-4 h-24 rounded bg-slate-200" /></div><div className="h-72 rounded-3xl bg-slate-200" /></div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: cards }, (_, index) => <div key={index} className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200"><div className="aspect-[0.9] bg-slate-200" /><div className="space-y-3 p-5"><div className="h-4 w-2/5 rounded bg-slate-200" /><div className="h-6 w-4/5 rounded bg-slate-200" /><div className="h-5 w-3/5 rounded bg-slate-200" /></div></div>)}</div>
        )}
      </div>
    </main>
  );
}
