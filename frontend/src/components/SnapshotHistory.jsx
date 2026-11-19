import React, { useState, useEffect } from 'react';
import { 
  Camera, Eye, RefreshCw, Zap, Clock, Droplets, 
  AlertTriangle, CheckCircle2, DollarSign, Activity, 
  Layers, Grid, List, Maximize2, X, ChevronRight, 
  Sparkles, ShieldCheck, Gauge
} from 'lucide-react';

export default function SnapshotHistory({ onSnapshotCaptured }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [showRoisInModal, setShowRoisInModal] = useState(true);
  const [flashAnimation, setFlashAnimation] = useState(false);

  const fetchSnapshots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/snapshots?limit=30');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error("Error fetching snapshots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleCapture = async (mode = 'normal') => {
    if (capturing) return;
    setCapturing(true);
    setFlashAnimation(true);
    setTimeout(() => setFlashAnimation(false), 400);

    try {
      const res = await fetch('/api/snapshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        const data = await res.json();
        // Prepend new snapshot
        if (data.snapshot) {
          setSnapshots(prev => [data.snapshot, ...prev]);
          if (onSnapshotCaptured) {
            onSnapshotCaptured(data.snapshot);
          }
        }
      }
    } catch (err) {
      console.error("Capture snapshot error:", err);
    } finally {
      setCapturing(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="card-modern relative overflow-hidden">
      {/* Visual Camera Flash Animation overlay */}
      {flashAnimation && (
        <div className="absolute inset-0 bg-white/40 pointer-events-none z-50 animate-fade-out" />
      )}

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Captured Snapshot History & Optical OCR
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800">
                {snapshots.length} Archived Frames
              </span>
            </div>
            <p className="text-xs text-slate-400">
              OV2640 dial image captures, TinyML recognized digits, flow telemetry and leak classifications
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid / Table View Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition flex items-center gap-1 ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition flex items-center gap-1 ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Audit Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchSnapshots}
            disabled={loading}
            className="btn-sim bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 flex items-center gap-1.5 text-xs"
            title="Refresh snapshots"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Live Capture Button */}
          <button
            onClick={() => handleCapture('normal')}
            disabled={capturing}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
          >
            <Camera className={`w-3.5 h-3.5 ${capturing ? 'animate-pulse' : ''}`} />
            <span>{capturing ? 'Capturing...' : 'Capture Snapshot Now'}</span>
          </button>
        </div>
      </div>

      {/* Snapshot Content */}
      {loading && snapshots.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-xs">Loading captured meter snapshots...</span>
        </div>
      ) : snapshots.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No snapshots recorded yet. Click "Capture Snapshot Now" to capture the first frame.
        </div>
      ) : viewMode === 'grid' ? (
        /* ── View 1: Card Grid View ─────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshots.map((snap) => {
            const digits = snap.digits || [];
            const isLeak = snap.is_leak === 1;

            return (
              <div 
                key={snap.id}
                className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Top Header: ID & Timestamp */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      #{snap.id}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatTimestamp(snap.created_at)}
                    </span>
                  </div>

                  {/* Real Captured Image Thumbnail with Hover Zoom */}
                  <div 
                    onClick={() => setSelectedSnapshot(snap)}
                    className="relative rounded-lg overflow-hidden bg-black/60 border border-slate-800 mb-3 cursor-pointer group-hover:border-cyan-500/50 transition aspect-[16/7] flex items-center justify-center"
                  >
                    <img 
                      src={snap.image_url} 
                      alt={`Dial Frame #${snap.id}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-white font-medium backdrop-blur-[1px]">
                      <Maximize2 className="w-4 h-4 text-cyan-400" />
                      Inspect Full Resolution
                    </div>
                  </div>

                  {/* Mechanical Roller Drums Display */}
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Extracted Drums:
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {Math.round((snap.confidence_avg || 0.995) * 100)}% Conf
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1 p-1 bg-slate-900 rounded border border-slate-800">
                      {digits.map((d, dIdx) => (
                        <div
                          key={dIdx}
                          className={`w-7 h-9 rounded flex items-center justify-center font-mono font-bold text-sm shadow-inner transition ${
                            d.color === 'red'
                              ? 'bg-red-600 text-white border border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                              : 'bg-slate-100 text-slate-900 border border-slate-300'
                          }`}
                          title={`Drum #${d.drum}: ${d.role} (${Math.round((d.conf || 0.99) * 100)}% conf)`}
                        >
                          {d.digit}
                        </div>
                      ))}
                      <span className="text-xs text-slate-400 font-mono ml-1 font-bold">m³</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Meter Reading:</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {Number(snap.reading).toFixed(4)} m³
                      </span>
                    </div>
                  </div>

                  {/* Flow Rate & Telemetry Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Flow Rate:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {Number(snap.flow_rate_lpm || 0).toFixed(2)} L/min
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Delta Volume:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        +{Number(snap.delta_volume_liters || 0).toFixed(1)} L
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Leak Status & Inspect Button */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {isLeak ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      LEAK: {snap.leak_severity}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      NORMAL
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedSnapshot(snap)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-medium transition"
                  >
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── View 2: Audit Table View ───────────────────────────────────────── */
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Dial Snapshot</th>
                <th className="py-2.5 px-3">Capture Time</th>
                <th className="py-2.5 px-3">5 Drums Extracted</th>
                <th className="py-2.5 px-3">Reading (m³)</th>
                <th className="py-2.5 px-3">Flow Rate</th>
                <th className="py-2.5 px-3">Delta (L)</th>
                <th className="py-2.5 px-3">Leak Status</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {snapshots.map((snap) => {
                const digits = snap.digits || [];
                const isLeak = snap.is_leak === 1;

                return (
                  <tr key={snap.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                      #{snap.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <img 
                        src={snap.image_url} 
                        alt={`Snapshot #${snap.id}`} 
                        className="w-16 h-8 object-contain rounded border border-slate-700 bg-black cursor-pointer hover:border-cyan-400 transition"
                        onClick={() => setSelectedSnapshot(snap)}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {formatTimestamp(snap.created_at)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-0.5 font-mono text-xs">
                        {digits.map((d, dIdx) => (
                          <span
                            key={dIdx}
                            className={`w-4 h-5 rounded flex items-center justify-center font-bold text-[11px] ${
                              d.color === 'red'
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-200 text-slate-900'
                            }`}
                          >
                            {d.digit}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">
                      {Number(snap.reading).toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {Number(snap.flow_rate_lpm || 0).toFixed(2)} L/min
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      +{Number(snap.delta_volume_liters || 0).toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3">
                      {isLeak ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          LEAK: {snap.leak_severity}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">
                      {Math.round((snap.confidence_avg || 0.995) * 100)}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedSnapshot(snap)}
                        className="p-1 rounded text-cyan-400 hover:text-white hover:bg-slate-700 transition"
                        title="Inspect snapshot"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail & Optical Inspection Modal ─────────────────────────────── */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="card-modern w-full max-w-2xl p-6 bg-slate-900 border border-slate-700 shadow-2xl relative rounded-2xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedSnapshot(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-3">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Dial Frame #{selectedSnapshot.id} Optical Inspection
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    QVGA 320×240
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Captured at: {formatTimestamp(selectedSnapshot.created_at)}
                </p>
              </div>
            </div>

            {/* Captured Dial Image with Interactive ROI Overlay */}
            <div className="relative bg-black/80 rounded-xl border border-slate-800 p-2 mb-5 flex items-center justify-center overflow-hidden">
              <div className="relative inline-block">
                <img 
                  src={selectedSnapshot.image_url} 
                  alt="Captured Dial Full Frame" 
                  className="max-h-[220px] w-auto object-contain rounded-lg shadow-xl"
                />

                {/* ROI Bounding Box Overlays */}
                {showRoisInModal && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="flex gap-1.5 p-1 bg-black/40 backdrop-blur-[1px] rounded border border-dashed border-cyan-400/60">
                      <div className="w-8 h-11 border-2 border-white/90 bg-white/10 rounded flex items-center justify-center text-[10px] text-white font-bold">1</div>
                      <div className="w-8 h-11 border-2 border-white/90 bg-white/10 rounded flex items-center justify-center text-[10px] text-white font-bold">2</div>
                      <div className="w-8 h-11 border-2 border-white/90 bg-white/10 rounded flex items-center justify-center text-[10px] text-white font-bold">3</div>
                      <div className="w-8 h-11 border-2 border-white/90 bg-white/10 rounded flex items-center justify-center text-[10px] text-white font-bold">4</div>
                      <div className="w-8 h-11 border-2 border-red-500 bg-red-500/20 rounded flex items-center justify-center text-[10px] text-red-200 font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.7)]">#8</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ROI Toggle in Corner */}
              <button
                onClick={() => setShowRoisInModal(!showRoisInModal)}
                className="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-md bg-slate-900/90 text-cyan-300 border border-slate-700 hover:bg-slate-800 transition flex items-center gap-1 shadow"
              >
                <Eye className="w-3 h-3" />
                {showRoisInModal ? 'Hide ROIs' : 'Show ROIs'}
              </button>
            </div>

            {/* Individual Drums Breakdown Grid */}
            <div className="mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                TinyML Classified Drum Digits (Softmax Inference):
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {(selectedSnapshot.digits || []).map((drum, idx) => (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${
                      drum.color === 'red'
                        ? 'bg-red-950/30 border-red-800/80 text-red-200'
                        : 'bg-slate-800/50 border-slate-700/80 text-slate-200'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-medium mb-1">
                      Drum #{drum.drum}
                    </span>
                    <span className={`w-8 h-10 rounded flex items-center justify-center text-lg font-mono font-bold mb-1 shadow ${
                      drum.color === 'red'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      {drum.digit}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {drum.role}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      {Math.round((drum.conf || 0.99) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Optical & Telemetry Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-5">
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Meter Reading</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {Number(selectedSnapshot.reading).toFixed(4)} m³
                </span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Flow Rate</span>
                <span className="font-mono font-bold text-white text-sm">
                  {Number(selectedSnapshot.flow_rate_lpm || 0).toFixed(2)} L/min
                </span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Delta Volume</span>
                <span className="font-mono font-bold text-white text-sm">
                  +{Number(selectedSnapshot.delta_volume_liters || 0).toFixed(1)} L
                </span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">NWSDB Tariff</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  Rs. {Number(selectedSnapshot.estimated_bill_lkr || 300).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Hardware & Camera Telemetry */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="font-bold text-slate-200 text-xs mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Optical Camera & Model Telemetry:
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">• Sensor:</span>
                <span className="font-mono text-slate-200">OmniVision OV2640 (Grayscale QVGA)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">• Illumination:</span>
                <span className="font-mono text-amber-300">GPIO 4 Flash LED (Fired 500ms)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">• CNN Inference Latency:</span>
                <span className="font-mono text-emerald-400">{selectedSnapshot.inference_time_ms || 45} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">• Leak Status:</span>
                <span className={`font-semibold ${selectedSnapshot.is_leak ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedSnapshot.leak_message || 'Normal flow'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

