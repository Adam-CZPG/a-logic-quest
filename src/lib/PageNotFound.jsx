import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-white/30">404</h1>
          <div className="h-0.5 w-16 bg-white/20 mx-auto"></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-medium">Page Not Found</h2>
          <p className="text-white/60 leading-relaxed">
            The page <span className="font-medium text-white/80">"{pageName}"</span> does not exist.
          </p>
        </div>
        <div className="pt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-white/10 border border-white/15 hover:bg-white/20 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
