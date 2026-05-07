export function ProductGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="rounded-md border border-white/10 bg-obsidian p-4">
          <div className="skeleton aspect-[4/5]" />
          <div className="mt-4 h-4 w-20 skeleton" />
          <div className="mt-3 h-6 w-3/4 skeleton" />
          <div className="mt-3 h-4 w-full skeleton" />
          <div className="mt-2 h-4 w-2/3 skeleton" />
          <div className="mt-5 h-11 w-full skeleton" />
        </div>
      ))}
    </div>
  );
}
