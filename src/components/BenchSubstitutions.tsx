import React, { useState } from 'react';
import { PlayerScore } from '@/hooks/useGroupData';
import toast from 'react-hot-toast';
import { Users, Zap, Check, ArrowDownUp, X, UserPlus } from 'lucide-react';

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
  const [guestName, setGuestName] = useState('');
  const [guestScore, setGuestScore] = useState('');
  const [suggestion, setSuggestion] = useState<{addedToWhite: PlayerScore[], addedToBlack: PlayerScore[], newWhite: PlayerScore[], newBlack: PlayerScore[]} | null>(null);

  const addGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestScore) return;
    onAddGuest?.(guestName.trim(), Number(guestScore));
    setGuestName('');
    setGuestScore('');
  };

  const allAvailableScores = scores;
  const whiteTeam = allAvailableScores.filter(s => whiteTeamIds.has(s.player.id)).sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));
  const blackTeam = allAvailableScores.filter(s => blackTeamIds.has(s.player.id)).sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));
  const benchComingUp = allAvailableScores.filter(s => selectedBenchIds.has(s.player.id)).sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));
  const unassigned = allAvailableScores.filter(s => !whiteTeamIds.has(s.player.id) && !blackTeamIds.has(s.player.id) && !selectedBenchIds.has(s.player.id)).sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));

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

  const handlePlayerClick = (id: string) => {
    const newWhite = new Set(whiteTeamIds);
    const newBlack = new Set(blackTeamIds);
    const newSelectedBench = new Set(selectedBenchIds);
    
    if (!newWhite.has(id) && !newBlack.has(id) && !newSelectedBench.has(id)) {
      // Unassigned -> Coming up
      newSelectedBench.add(id);
    } else if (newSelectedBench.has(id)) {
      // Coming up -> White
      newSelectedBench.delete(id);
      newWhite.add(id);
    } else if (newWhite.has(id)) {
      // White -> Black
      newWhite.delete(id);
      newBlack.add(id);
    } else {
      // Black -> Unassigned
      newBlack.delete(id);
    }

    onChangeTeams(newWhite, newBlack);
    setSelectedBenchIds(newSelectedBench);
  };

  const handleSuggest = () => {
    if (benchComingUp.length === 0) {
      return toast.error('יש לבחור שחקנים לעלייה מהספסל.');
    }

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
      
      // Auto apply
      onChangeTeams(
        new Set(bestWhite.map(p => p.player.id)),
        new Set(bestBlack.map(p => p.player.id))
      );
      setSelectedBenchIds(new Set());

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
          <span className="hidden md:inline">גרור שחקנים בין הקבוצות או לסל "עולים מהספסל", והמערכת תשבץ אותם הוגן.</span><span className="md:hidden">לחץ על שחקנים כדי להעביר אותם. המערכת יכולה גם לשבץ הוגן.</span>
        </p>
      </div>

      <button
          onClick={handleSuggest}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex justify-center items-center gap-2 shadow-sm mb-6 transition-colors"
        >
          <ArrowDownUp size={20} />
          הצע חלוקה הוגנת לעולים מהספסל
        </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'white')}
          className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-[150px]"
        >
          <h4 className="font-bold text-slate-800 mb-3 flex items-center justify-between border-b pb-2">
            <span>קבוצה לבנה <span className="md:hidden text-xs font-normal text-slate-500">(לחץ לשינוי לשחור)</span></span>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">{whiteTeam.length} שחקנים</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {whiteTeam.map(s => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                onClick={() => handlePlayerClick(s.player.id)}
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
            <span>קבוצה שחורה <span className="md:hidden text-xs font-normal text-slate-400">(לחץ לספסל)</span></span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">{blackTeam.length} שחקנים</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {blackTeam.map(s => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                onClick={() => handlePlayerClick(s.player.id)}
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
          <span className="hidden md:inline">מי עולה מהספסל? (גרור לכאן)</span><span className="md:hidden">מי עולה מהספסל? (לחץ ללבן)</span>
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
        <h4 className="text-sm font-bold text-slate-500 mb-3"><span className="hidden md:inline">שאר הספסל (גרור לעולים מהספסל):</span><span className="md:hidden">שאר הספסל (לחץ להעברה לעולים):</span></h4>
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

      

            {/* Guests Section */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mt-8">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
          <UserPlus size={16} />
          הוספת אורח
        </h3>
        <form onSubmit={addGuest} className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="שם האורח"
            className="flex-1 border border-slate-300 p-2 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <input 
              type="number" 
              value={guestScore}
              onChange={(e) => setGuestScore(e.target.value)}
              placeholder="ציון"
              className="w-20 border border-slate-300 p-2 rounded-lg text-sm text-center"
              min="0" max="100"
            />
            <button type="submit" className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              הוסף
            </button>
          </div>
        </form>
        {(scores.filter(s => s.player.isGuest).length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {scores.filter(s => s.player.isGuest).map(g => (
              <span key={g.player.id} className="bg-white border px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2">
                {g.player.name} {showScores && <><span className="text-slate-400">|</span> <span className="text-blue-600">{g.score}</span></>}
                <button onClick={() => onRemoveGuest?.(g.player.id)} className="text-slate-400 hover:text-red-500 ml-1">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

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
                onClick={() => setSuggestion(null)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-xl shadow-sm transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
