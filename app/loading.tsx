export default function Loading() {
  return (
    <div className="section-shell grid min-h-[60vh] place-items-center py-16">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}
