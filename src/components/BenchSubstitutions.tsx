import React, { useState } from 'react';
import { PlayerScore } from '@/hooks/useGroupData';
import { Users, Zap, Check, ArrowDownUp } from 'lucide-react';

const calcStdDev = (players: PlayerScore[], totalScore: number) => {
  if (players.length === 0) return 0;
  const mean = totalScore / players.length;
  const variance = players.reduce((sum, p) => sum + Math.pow(p.score - mean, 2), 0) / players.length;
  return Math.sqrt(variance);
};

export default function BenchSubstitutions({ 
  scores, 
  showScores, 
  whiteTeamIds, 
  blackTeamIds, 
  onChangeTeams 
}: { 
  scores: PlayerScore[], 
  showScores: boolean, 
  onAddGuest?: (name: string, score: number) => void, 
  onRemoveGuest?: (id: string) => void, 
  whiteTeamIds: Set<string>, 
  blackTeamIds: Set<string>, 
  onChangeTeams: (white: Set<string>, black: Set<string>) => void 
}) {
  const [selectedBenchIds, setSelectedBenchIds] = useState<Set<string>>(new Set());

  const allAvailableScores = scores;
  const whiteTeam = allAvailableScores.filter(s => whiteTeamIds.has(s.player.id));
  const blackTeam = allAvailableScores.filter(s => blackTeamIds.has(s.player.id));
  const unassigned = allAvailableScores.filter(s => !whiteTeamIds.has(s.player.id) && !blackTeamIds.has(s.player.id));

  const toggleBenchPlayer = (id: string) => {
    const newSet = new Set(selectedBenchIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedBenchIds(newSet);
  };

  const handleSuggest = () => {
    const benchPlayers = unassigned.filter(s => selectedBenchIds.has(s.player.id));
    if (benchPlayers.length === 0) return;

    const totalSize = whiteTeam.length + blackTeam.length + benchPlayers.length;
    const targetSizeWhite = Math.ceil(totalSize / 2);
    const targetSizeBlack = Math.floor(totalSize / 2); // sizes could be swapped, we'll check both

    let bestDiff = Infinity;
    let bestWhite: PlayerScore[] = [];
    let bestBlack: PlayerScore[] = [];

    const numCombinations = Math.pow(2, benchPlayers.length);

    for (let i = 0; i < numCombinations; i++) {
      const currentWhite = [...whiteTeam];
      const currentBlack = [...blackTeam];

      for (let j = 0; j < benchPlayers.length; j++) {
        if ((i & (1 << j)) !== 0) {
          currentWhite.push(benchPlayers[j]);
        } else {
          currentBlack.push(benchPlayers[j]);
        }
      }

      const sizeDiff = Math.abs(currentWhite.length - currentBlack.length);
      if (sizeDiff > 1) continue; // Only accept balanced team sizes

      const whiteScore = currentWhite.reduce((sum, p) => sum + p.score, 0);
      const blackScore = currentBlack.reduce((sum, p) => sum + p.score, 0);
      const whiteStdDev = calcStdDev(currentWhite, whiteScore);
      const blackStdDev = calcStdDev(currentBlack, blackScore);

      const scoreDiff = Math.abs(whiteScore - blackScore);
      const stdDevDiff = Math.abs(whiteStdDev - blackStdDev);
      const diff = scoreDiff + (stdDevDiff * 1.5);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestWhite = currentWhite;
        bestBlack = currentBlack;
      }
    }

    if (bestDiff !== Infinity) {
      onChangeTeams(
        new Set(bestWhite.map(p => p.player.id)),
        new Set(bestBlack.map(p => p.player.id))
      );
      setSelectedBenchIds(new Set()); // clear selection
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200" dir="rtl">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">עליה מהספסל</h2>
        <p className="text-sm text-slate-500 mt-1">
          בחר שחקנים מהספסל והמערכת תשבץ אותם אוטומטית לקבוצות הקיימות.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
            <span>קבוצה לבנה</span>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">{whiteTeam.length} שחקנים</span>
          </h3>
          <div className="flex flex-col gap-2">
            {whiteTeam.map(s => (
              <div key={s.player.id} className="bg-white p-2 border rounded-lg flex justify-between items-center text-sm font-semibold text-slate-700">
                {s.player.name}
                {showScores && <span className="text-blue-600">{s.score.toFixed(1)}</span>}
              </div>
            ))}
            {whiteTeam.length === 0 && <div className="text-sm text-slate-400 text-center py-4">אין שחקנים</div>}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="font-bold text-white mb-3 flex items-center justify-between">
            <span>קבוצה שחורה</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">{blackTeam.length} שחקנים</span>
          </h3>
          <div className="flex flex-col gap-2">
            {blackTeam.map(s => (
              <div key={s.player.id} className="bg-slate-700 p-2 border border-slate-600 rounded-lg flex justify-between items-center text-sm font-semibold text-white">
                {s.player.name}
                {showScores && <span className="text-blue-300">{s.score.toFixed(1)}</span>}
              </div>
            ))}
            {blackTeam.length === 0 && <div className="text-sm text-slate-400 text-center py-4">אין שחקנים</div>}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
          מי עולה מהספסל?
          <span className="text-sm font-normal text-slate-500">{selectedBenchIds.size} נבחרו</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {unassigned.map(s => {
            const isSelected = selectedBenchIds.has(s.player.id);
            return (
              <button
                key={s.player.id}
                onClick={() => toggleBenchPlayer(s.player.id)}
                className={`p-3 rounded-xl flex flex-col justify-center items-center transition-all border-2 h-16 relative overflow-hidden ${
                  isSelected 
                    ? 'bg-indigo-500 border-indigo-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check size={14} className="text-indigo-100" />
                  </div>
                )}
                <span className="font-bold text-sm text-center leading-tight">
                  {s.player.name}
                </span>
                {showScores && (
                  <span className={`text-xs mt-1 font-bold ${isSelected ? 'text-indigo-100' : 'text-blue-600'}`}>
                    {s.score.toFixed(1)}
                  </span>
                )}
              </button>
            );
          })}
          {unassigned.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-400 border-2 border-dashed rounded-xl">
              אין שחקנים פנויים בספסל
            </div>
          )}
        </div>
      </div>

      {selectedBenchIds.size > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleSuggest}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all flex items-center gap-2 transform hover:scale-105"
          >
            <ArrowDownUp size={20} />
            המלץ חלוקה הוגנת
          </button>
        </div>
      )}
    </div>
  );
}
