import React from 'react';

interface ScoreCardProps {
  title: string;
  score: number;
  reason: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, reason }) => {
  const barColor = score >= 80 ? 'bg-emerald-600' : score >= 60 ? 'bg-amber-500' : 'bg-rose-600';
  const scoreColor = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-600' : 'text-rose-700';

  return (
    <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
        <span className={`text-xl font-bold ${scoreColor}`}>{score}</span>
      </div>
      <div className="w-full bg-stone-100 rounded-full h-2 mb-3">
        <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${score}%` }}></div>
      </div>
      <p className="text-stone-700 text-xs mt-2 leading-relaxed font-medium border-t border-stone-100 pt-2">
        <span className="font-bold text-stone-800">Alasan: </span>{reason}
      </p>
    </div>
  );
};
