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
  onAddGuest, 
  onRemoveGuest, 
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
  const [suggestion, setSuggestion] = useState<{addedToWhite: PlayerScore[], addedToBlack: PlayerScore[], newWhite: PlayerScore[], newBlack: PlayerScore[]} | null>(null);

  const allAvailableScores = scores;
  const whiteTeam = allAvailableScores.filter(s => whiteTeamIds.has(s.player.id));
  const blackTeam = allAvailableScores.filter(s => blackTeamIds.has(s.player.id));
  const benchComingUp = allAvailableScores.filter(s => selectedBenchIds.has(s.player.id));
  const unassigned = allAvailableScores.filter(s => !whiteTeamIds.has(s.player.id) && !blackTeamIds.has(s.player.id) && !selectedBenchIds.has(s.player.id));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('playerId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, target: 'white' | 'black' | 'coming_up' | 'unassigned') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('playerId');
    if (!id) return;
    
    const newWhite = new Set(whiteTeamIds);
    const newBlack = new Set(blackTeamIds);
    const newSelectedBench = new Set(selectedBenchIds);
    
    // Remove from everywhere first
    newWhite.delete(id);
    newBlack.delete(id);
    newSelectedBench.delete(id);

    // Add to target
    if (target === 'white') newWhite.add(id);
    else if (target === 'black') newBlack.add(id);
    else if (target === 'coming_up') newSelectedBench.add(id);
    // if unassigned, it just stays removed from everything

    onChangeTeams(newWhite, newBlack);
    setSelectedBenchIds(newSelectedBench);
  };

  // Clicking toggles between unassigned and coming_up
  const handlePlayerClick = (id: string) => {
    if (whiteTeamIds.has(id) || blackTeamIds.has(id)) return; // Don't click to toggle if in team, force drag
    
    const newSet = new Set(selectedBenchIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedBenchIds(newSet);
  };

  const handleSuggest = () => {
    if (benchComingUp.length === 0) return;

    const totalSize = whiteTeam.length + blackTeam.length + benchComingUp.length;

    let bestDiff = Infinity;
    let bestWhite: PlayerScore[] = [];
    let bestBlack: PlayerScore[] = [];

    const numCombinations = Math.pow(2, benchComingUp.length);

    for (let i = 0; i < numCombinations; i++) {
      const currentWhite = [...whiteTeam];
      const currentBlack = [...blackTeam];

      for (let j = 0; j < benchComingUp.length; j++) {
        if ((i & (1 << j)) !== 0) {
          currentWhite.push(benchComingUp[j]);
        } else {
          currentBlack.push(benchComingUp[j]);
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
      const addedToWhite = benchComingUp.filter(p => bestWhite.some(w => w.player.id === p.player.id));
      const addedToBlack = benchComingUp.filter(p => bestBlack.some(b => b.player.id === p.player.id));
      
      setSuggestion({
        addedToWhite,
        addedToBlack,
        newWhite: bestWhite,
        newBlack: bestBlack
      });
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200" dir="rtl">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">עליה מהספסל</h2>
        <p className="text-sm text-slate-500 mt-1">
          גרור שחקנים בין הקבוצות או לסל "עולים מהספסל", והמערכת תשבץ אותם הוגן.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'white')}
          className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-[150px]"
        >
          <h4 className="font-bold text-slate-800 mb-3 flex items-center justify-between border-b pb-2">
            <span>קבוצה לבנה</span>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">{whiteTeam.length} שחקנים</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {whiteTeam.map(s => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-slate-50"
              >
                {s.player.name}
              </div>
            ))}
            {whiteTeam.length === 0 && <div className="text-sm text-slate-400 w-full text-center py-4">גרור לכאן</div>}
          </div>
        </div>

        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'black')}
          className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-4 min-h-[150px]"
        >
          <h4 className="font-bold text-white mb-3 flex items-center justify-between border-b border-slate-700 pb-2">
            <span>קבוצה שחורה</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">{blackTeam.length} שחקנים</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {blackTeam.map(s => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                className="bg-black text-white border border-slate-600 px-3 py-2 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-gray-800"
              >
                {s.player.name}
              </div>
            ))}
            {blackTeam.length === 0 && <div className="text-sm text-slate-400 w-full text-center py-4">גרור לכאן</div>}
          </div>
        </div>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'coming_up')}
        className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-4 mb-6 min-h-[120px]"
      >
        <h4 className="font-bold text-indigo-800 mb-3 flex items-center justify-between border-b border-indigo-100 pb-2">
          מי עולה מהספסל? (גרור לכאן או לחץ על שחקן למטה)
          <span className="text-xs bg-indigo-100 px-2 py-1 rounded-full">{benchComingUp.length} נבחרו</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {benchComingUp.map(s => (
            <div
              key={s.player.id}
              draggable
              onDragStart={(e) => handleDragStart(e, s.player.id)}
              onClick={() => handlePlayerClick(s.player.id)}
              className="bg-indigo-500 text-white border border-indigo-600 px-3 py-2 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-indigo-600"
            >
              {s.player.name} {showScores && <span className="text-xs text-indigo-200 ml-1">{s.score.toFixed(1)}</span>}
            </div>
          ))}
          {benchComingUp.length === 0 && <div className="text-sm text-indigo-300 w-full text-center py-4">גרור שחקנים לכאן</div>}
        </div>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'unassigned')}
        className="mt-6 border-t pt-4"
      >
        <h4 className="text-sm font-bold text-slate-500 mb-3">שאר הספסל:</h4>
        <div className="flex flex-wrap gap-2 min-h-[50px]">
          {unassigned.map(s => (
            <div
              key={s.player.id}
              draggable
              onDragStart={(e) => handleDragStart(e, s.player.id)}
              onClick={() => handlePlayerClick(s.player.id)}
              className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-700 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm"
            >
              {s.player.name} {showScores && <span className="text-xs text-slate-400 ml-1">{s.score.toFixed(1)}</span>}
            </div>
          ))}
        </div>
      </div>

      {benchComingUp.length > 0 && (
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

      {suggestion && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4 text-center">המלצת חלוקה</h3>
            
            <div className="space-y-6 mb-8">
              {suggestion.addedToWhite.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">עולים לקבוצה הלבנה:</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.addedToWhite.map(p => (
                      <span key={p.player.id} className="bg-white px-3 py-1.5 rounded-lg border shadow-sm font-semibold text-slate-800">{p.player.name}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {suggestion.addedToBlack.length > 0 && (
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-white mb-2">עולים לקבוצה השחורה:</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.addedToBlack.map(p => (
                      <span key={p.player.id} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-600 shadow-sm font-semibold text-white">{p.player.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {suggestion.addedToWhite.length === 0 && suggestion.addedToBlack.length === 0 && (
                <div className="text-center text-slate-500 py-4">אין שינויים</div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  onChangeTeams(
                    new Set(suggestion.newWhite.map(p => p.player.id)),
                    new Set(suggestion.newBlack.map(p => p.player.id))
                  );
                  setSelectedBenchIds(new Set());
                  setSuggestion(null);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
              >
                אשר חלוקה
              </button>
              <button 
                onClick={() => setSuggestion(null)}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 font-bold py-3 rounded-xl shadow-sm transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
