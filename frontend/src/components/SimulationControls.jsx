import React, { useState } from 'react';
import { Play, Flame, AlertCircle } from 'lucide-react';

export default function SimulationControls({ onSimulate }) {
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (mode) => {
    setLoading(true);
    await onSimulate(mode);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSimulate('normal')}
        disabled={loading}
        className="btn-sim bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 flex items-center gap-1.5"
      >
        <Play className="w-3.5 h-3.5 text-cyan-400" />
        + Normal Flow
      </button>

      <button
        onClick={() => handleSimulate('leak')}
        disabled={loading}
        className="btn-sim bg-red-950/40 hover:bg-red-900/60 text-red-200 border-red-800/60 flex items-center gap-1.5"
      >
        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        + Night Leak
      </button>

      <button
        onClick={() => handleSimulate('burst')}
        disabled={loading}
        className="btn-sim bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border-amber-800/60 flex items-center gap-1.5"
      >
        <Flame className="w-3.5 h-3.5 text-amber-400" />
        + Pipe Burst
      </button>
    </div>
  );
}

