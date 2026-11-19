import React from 'react';
import { Waves } from 'lucide-react';

export default function FlowCard({ flowRate = 0.0 }) {
  const maxCapacity = 25.0; // 3/4" pipe typical domestic max
  const percentage = Math.min(100, Math.max(0, (flowRate / maxCapacity) * 100));

  let statusColor = "bg-cyan-500";
  let statusText = "Normal Flow";
  if (flowRate > 20.0) {
    statusColor = "bg-red-500";
    statusText = "Peak / Burst Flow";
  } else if (flowRate > 0.15 && flowRate < 2.0) {
    statusColor = "bg-amber-400";
    statusText = "Low / Micro Flow";
  }

  return (
    <div className="card-modern flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <Waves className="w-4 h-4 text-cyan-400" />
          Instantaneous Flow Rate
        </span>
        <span className="px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 font-semibold text-[11px] border border-cyan-800">
          3/4" Supply Line
        </span>
      </div>

      <div className="my-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {Number(flowRate).toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-slate-400">L/min</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2.5 mt-3 overflow-hidden border border-slate-700/50">
          <div 
            className={`h-full ${statusColor} transition-all duration-500 rounded-full`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="text-xs text-slate-400 flex items-center justify-between">
        <span>Capacity: {percentage.toFixed(0)}%</span>
        <span className="text-slate-500">Min leak floor: 0.15 L/min</span>
      </div>
    </div>
  );
}

