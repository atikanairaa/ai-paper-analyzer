import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { PaperFinding } from '../types/paper';

interface WeaknessCardProps {
  finding: PaperFinding;
}

export const WeaknessCard: React.FC<WeaknessCardProps> = ({ finding }) => {
  const isHighSeverity = finding.severity === 'HIGH' || finding.severity === 'CRITICAL';

  const borderColor = isHighSeverity ? 'border-rose-500' : 'border-amber-400';
  const bgColor = isHighSeverity ? 'bg-rose-50/60 border border-rose-200' : 'bg-amber-50/60 border border-amber-200';
  const iconColor = isHighSeverity ? 'text-rose-500' : 'text-amber-500';
  const headerColor = isHighSeverity ? 'text-rose-900' : 'text-amber-900';
  const badgeBg = isHighSeverity ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

  return (
    <div className={`rounded-xl border-l-4 ${borderColor} ${bgColor} p-4 mb-4 shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {isHighSeverity ? (
            <AlertCircle className={`w-5 h-5 ${iconColor}`} />
          ) : (
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
          )}
        </div>
        <div className="ml-3 w-full">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-bold ${headerColor}`}>{finding.finding}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${badgeBg}`}>
              {finding.severity}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-stone-700 font-medium">
              <span className="font-bold text-stone-800">Kategori: </span>
              <span className="capitalize">{finding.category}</span>
            </p>
            <p className="text-sm text-stone-700 font-medium">
              <span className="font-bold text-stone-800">Penjelasan: </span>{finding.explanation}
            </p>
            
            {(finding.page || finding.section || finding.confidence !== null) && (
              <div className="flex flex-wrap gap-2 py-1">
                {finding.page && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                    Hal: {finding.page}
                  </span>
                )}
                {finding.section && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                    Bab: {finding.section}
                  </span>
                )}
                {finding.confidence !== null && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${finding.confidence >= 0.8 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : finding.confidence >= 0.5 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    AI Confidence: {Math.round(finding.confidence * 100)}%
                  </span>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-stone-700 font-medium bg-white p-2 rounded-lg border border-[#e8e4dc]">
              <span className="font-bold text-stone-800">Bukti: </span>{finding.evidence}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
