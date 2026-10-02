import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({ message = "No se pudieron cargar los datos.", onRetry }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </span>
      <p className="text-sm font-medium text-slate-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" /> Reintentar
        </button>
      )}
    </div>
  );
}
