import React from 'react';
import { Gauge } from 'lucide-react';

export default function MeterDrum({ reading = 0.0 }) {
  // Format reading into 5 digits: 4 whole units (white) + 1 sub-unit decimal (red drum #8)
  const readingStr = Number(reading).toFixed(4).replace('.', '');
  const padded = readingStr.padStart(6, '0');
  const digits = padded.slice(-5).split('');

  return (
    <div className="card-modern flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <Gauge className="w-4 h-4 text-cyan-400" />
          Mechanical Dial Reading
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
          Units (m³)
        </span>
      </div>

      <div className="my-5 text-center">
        <div className="meter-drum-box">
          <div className="drum-digit drum-white" title="Unit Drum (Thousands)">{digits[0] || '0'}</div>
          <div className="drum-digit drum-white" title="Unit Drum (Hundreds)">{digits[1] || '0'}</div>
          <div className="drum-digit drum-white" title="Unit Drum (Tens)">{digits[2] || '0'}</div>
          <div className="drum-digit drum-white" title="Unit Drum (Ones)">{digits[3] || '0'}</div>
          <div className="drum-digit drum-red" title="Fastest Fractional Drum (Speed #8)">{digits[4] || '0'}</div>
        </div>
      </div>

      <div className="text-xs text-slate-400 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-slate-100 rounded-sm inline-block"></span>
          White = Whole m³
        </span>
        <span>•</span>
        <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
          <span className="w-2.5 h-2.5 bg-red-600 rounded-sm inline-block"></span>
          Red = High-Speed Drum (#8)
        </span>
      </div>
    </div>
  );
}

