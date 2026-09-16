import React from 'react';

interface ScoreCardProps {
  title: string;
  score: number;
  reason: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, reason }) => {
  // Determine color based on score
  let progressColor = 'bg-red-50 dark:bg-rose-900/300';
  if (score >= 80) progressColor = 'bg-green-50 dark:bg-emerald-900/300';
  else if (score >= 60) progressColor = 'bg-yellow-50 dark:bg-amber-900/300';

  return (
    <div className="bg-white/95 dark:bg-[#1e293b]/90 rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className={`text-lg font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {score}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${score}%` }}></div>
      </div>
      <p className="text-xs text-gray-600 mt-2 border-t pt-2 border-gray-100">
        <span className="font-semibold text-gray-800">Alasan:</span> {reason}
      </p>
    </div>
  );
};

