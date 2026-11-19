import React from 'react';
import { ReceiptText, ShieldCheck } from 'lucide-react';

export default function TariffCard({ bill = 300.0, currentRate = 60.0, fixedCharge = 300.0, consumedUnits = 0.0 }) {
  return (
    <div className="card-modern flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <ReceiptText className="w-4 h-4 text-amber-400" />
          Estimated NWSDB Bill
        </span>
        <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 font-semibold text-[11px] border border-amber-800">
          Domestic Slab
        </span>
      </div>

      <div className="my-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-amber-400 tracking-tight">
            Rs. {Number(bill).toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Active Slab: Rs. {currentRate}/unit + Rs. {fixedCharge} Fixed Service Charge
        </p>
      </div>

      <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
        <span>Consumed: <strong className="text-slate-200">{consumedUnits} m³</strong></span>
        <span className="text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          NWSDB Calibrated
        </span>
      </div>
    </div>
  );
}

