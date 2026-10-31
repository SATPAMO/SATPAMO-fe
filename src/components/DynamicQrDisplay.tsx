import React, { useMemo, useState } from "react";
import { Copy, Check, Info, Download, QrCode } from "lucide-react";
import { generateQrMatrix } from "../lib/qrCode";

interface DynamicQrDisplayProps {
  value: string;
  pin: string;
  size?: number;
  showPin?: boolean;
  showDetails?: boolean;
  onCopyPin?: (pin: string) => void;
  className?: string;
}

export function DynamicQrDisplay({
  value,
  pin,
  size = 140,
  showPin = true,
  showDetails = false,
  onCopyPin,
  className = "",
}: DynamicQrDisplayProps) {
  const [copiedPin, setCopiedPin] = useState(false);
  const [showPayloadModal, setShowPayloadModal] = useState(false);

  // Generate QR Matrix
  const qrData = useMemo(() => {
    try {
      return generateQrMatrix(value || "SATPAMO");
    } catch {
      // Fallback
      return generateQrMatrix("SATPAMO:" + pin);
    }
  }, [value, pin]);

  const handleCopyPin = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    if (onCopyPin) onCopyPin(pin);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDownloadSvg = (e: React.MouseEvent) => {
    e.stopPropagation();
    const svgElem = document.getElementById(`qr-svg-${pin}`);
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SATPAMO-QR-${pin}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const padding = 2; // modules padding around QR
  const totalDim = qrData.size + padding * 2;

  return (
    <div className={`flex flex-col items-center gap-2.5 ${className}`}>
      {/* QR Code Container */}
      <div
        className="relative bg-white rounded-2xl p-3.5 shadow-md border border-sky-200/90 group transition-transform hover:scale-[1.01]"
        style={{ width: size + 28, height: size + 28 }}
      >
        <svg
          id={`qr-svg-${pin}`}
          width={size}
          height={size}
          viewBox={`0 0 ${totalDim} ${totalDim}`}
          className="block w-full h-full"
          shapeRendering="crispEdges"
        >
          {/* White Background */}
          <rect
            x="0"
            y="0"
            width={totalDim}
            height={totalDim}
            fill="#ffffff"
            rx="1.5"
          />

          {/* QR Code Modules */}
          {qrData.modules.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              // Add visual flair: slightly darker navy for finder pattern areas
              const isFinder =
                (r < 7 && c < 7) ||
                (r < 7 && c >= qrData.size - 7) ||
                (r >= qrData.size - 7 && c < 7);
              return (
                <rect
                  key={`${r}-${c}`}
                  x={c + padding}
                  y={r + padding}
                  width="1"
                  height="1"
                  fill={isFinder ? "#0369a1" : "#0f172a"}
                  rx={isFinder ? "0.15" : "0.05"}
                />
              );
            })
          )}
        </svg>

        {/* Action icons on hover */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm rounded-lg p-0.5 shadow-sm border border-slate-200">
          <button
            type="button"
            onClick={handleDownloadSvg}
            title="Unduh QR Code (SVG)"
            className="p-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowPayloadModal(true)}
            title="Lihat Detail Payload"
            className="p-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Emergency PIN display */}
      {showPin && (
        <div className="text-center w-full">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">
              KODE PIN DARURAT
            </span>
            <button
              type="button"
              onClick={handleCopyPin}
              title="Salin PIN"
              className="p-0.5 text-slate-500 hover:text-sky-800 transition-colors inline-flex items-center"
            >
              {copiedPin ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="text-2xl font-black text-sky-950 font-mono tracking-widest selection:bg-sky-200">
              {pin}
            </span>
          </div>
          {copiedPin && (
            <p className="text-[10px] text-emerald-700 font-bold animate-fadeIn">
              PIN berhasil disalin!
            </p>
          )}
        </div>
      )}

      {/* Payload info pill */}
      {showDetails && (
        <button
          type="button"
          onClick={() => setShowPayloadModal(true)}
          className="text-[10px] text-sky-800 hover:text-sky-950 flex items-center gap-1 hover:underline font-semibold"
        >
          <QrCode className="w-3 h-3" />
          Detail Data Token QR
        </button>
      )}

      {/* Payload Details Modal */}
      {showPayloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setShowPayloadModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-sky-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-sky-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  Data Terenkripsi QR Code
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPayloadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded-lg"
              >
                Tutup
              </button>
            </div>

            <div className="my-3 space-y-2">
              <p className="text-xs text-slate-600">
                Data mentah yang tersimpan di dalam QR Code dinamis ini:
              </p>
              <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 break-all whitespace-pre-wrap max-h-48 overflow-y-auto">
                {value}
              </pre>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
                  <span className="text-slate-500 font-medium block">Kode PIN:</span>
                  <span className="font-bold text-sky-950 font-mono text-sm">{pin}</span>
                </div>
                <div className="bg-sky-50 p-2 rounded-lg border border-sky-100">
                  <span className="text-slate-500 font-medium block">Dimensi Matriks:</span>
                  <span className="font-bold text-sky-950">{qrData.size}x{qrData.size} modul</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(value);
                  setShowPayloadModal(false);
                }}
                className="text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
              >
                Salin String Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
