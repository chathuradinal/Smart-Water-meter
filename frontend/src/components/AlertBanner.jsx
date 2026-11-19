import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function AlertBanner({ alert, onDismiss }) {
  if (!alert) return null;

  return (
    <div className="alert-banner flex items-center justify-between gap-4 text-white">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-950/60 rounded-lg text-white">
          <AlertTriangle className="w-6 h-6 animate-bounce" />
        </div>
        <div>
          <h4 className="font-bold text-base tracking-wide flex items-center gap-2">
            <span>{alert.severity || 'CRITICAL'} LEAK DETECTED</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-900 border border-red-700">
              Immediate Action Advised
            </span>
          </h4>
          <p className="text-sm text-red-100 mt-0.5">{alert.message}</p>
        </div>
      </div>
      <button 
        onClick={onDismiss}
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold transition"
      >
        Acknowledge
      </button>
    </div>
  );
}

