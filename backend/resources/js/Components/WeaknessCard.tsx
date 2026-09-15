import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { PaperFinding } from '../types/paper';

interface WeaknessCardProps {
  finding: PaperFinding;
}

export const WeaknessCard: React.FC<WeaknessCardProps> = ({ finding }) => {
  const isHighSeverity = finding.severity === 'HIGH' || finding.severity === 'CRITICAL';
  
  const borderColor = isHighSeverity ? 'border-red-500' : 'border-yellow-500';
  const bgColor = isHighSeverity ? 'bg-red-50' : 'bg-yellow-50';
  const iconColor = isHighSeverity ? 'text-red-500' : 'text-yellow-500';
  const headerColor = isHighSeverity ? 'text-red-800' : 'text-yellow-800';

  return (
    <div className={`rounded-lg border-l-4 ${borderColor} ${bgColor} p-4 mb-4 shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {isHighSeverity ? (
            <AlertCircle className={`w-5 h-5 ${iconColor}`} />
          ) : (
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
          )}
        </div>
        <div className="ml-3 w-full">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${headerColor}`}>
              {finding.finding}
            </h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isHighSeverity ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
              {finding.severity}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-700">
            <p className="mb-1"><span className="font-semibold text-gray-900">Kategori:</span> <span className="capitalize">{finding.category}</span></p>
            <p className="mb-1"><span className="font-semibold text-gray-900">Penjelasan:</span> {finding.explanation}</p>
            <p className="mt-2 text-xs text-gray-500 italic bg-white p-2 rounded border border-gray-200">
              <span className="font-semibold not-italic text-gray-700">Bukti:</span> {finding.evidence}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
