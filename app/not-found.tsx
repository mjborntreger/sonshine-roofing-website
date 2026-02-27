export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-900 px-4 text-center text-white">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-wide text-slate-300">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-base text-slate-200">The page you are looking for does not exist.</p>
      </div>
    </div>
  );
}
