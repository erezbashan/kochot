import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PlayerScore } from '@/hooks/useGroupData';
import { generateTeams, Team } from '@/lib/teamGenerator';
import { Users, UserPlus, Zap, Check, X } from 'lucide-react';

export default function TeamGenerator({ scores, showScores, onAddGuest, onRemoveGuest }: { scores: PlayerScore[], showScores: boolean, onAddGuest: (name: string, score: number) => void, onRemoveGuest: (id: string) => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Guests feature
    const [guestName, setGuestName] = useState('');
  const [guestScore, setGuestScore] = useState('50');

  const [generatedTeams, setGeneratedTeams] = useState<{teamWhite: Team, teamBlack: Team} | null>(null);

  const togglePlayer = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const addGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim() && !isNaN(Number(guestScore))) {
      onAddGuest(guestName.trim(), Number(guestScore));
      setGuestName('');
      setGuestScore('50');
    }
  };

  const removeGuest = (id: string) => {
    onRemoveGuest(id);
    const newSet = new Set(selectedIds);
    newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleGenerate = () => {
    const allScores = scores;
    const selectedPlayers = allScores.filter(s => selectedIds.has(s.player.id));
    
    if (selectedPlayers.length === 0) {
      return toast.error('יש לבחור שחקנים כדי ליצור קבוצות.');
    }
    if (selectedPlayers.length % 2 !== 0) {
      return toast.error('יש לבחור מספר זוגי של שחקנים.');
    }

    const teams = generateTeams(selectedPlayers);
    setGeneratedTeams(teams);
  };

  const allAvailableScores = scores.filter(s => !s.player.isGuest).sort((a, b) => 
    a.player.name.localeCompare(b.player.name, 'he')
  );

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200" dir="rtl">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">מי משחק היום?</h2>
      </div>
      
      {/* Guests Section */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
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
            className="flex-1 border border-slate-300 p-2 rounded-lg focus:border-blue-500 outline-none text-sm"
          />
          <div className="flex gap-2">
            <input 
              type="number" 
              value={guestScore}
              onChange={(e) => setGuestScore(e.target.value)}
              placeholder="ציון"
              className="w-20 border border-slate-300 p-2 rounded-lg focus:border-blue-500 outline-none text-sm text-center"
              min="0" max="100"
            />
            <button type="submit" className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-slate-800 text-sm font-semibold">
              הוסף
            </button>
          </div>
        </form>
        {(scores.filter(s => s.player.isGuest).length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {scores.filter(s => s.player.isGuest).map(g => (
              <span key={g.player.id} className="bg-white border border-slate-300 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2">
                {g.player.name} {showScores && <><span className="text-slate-400">|</span> <span className="text-blue-600">{g.score}</span></>}
                <button onClick={() => removeGuest(g.player.id)} className="text-slate-400 hover:text-red-500 ml-1">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={handleGenerate}
        className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex justify-center items-center gap-2 mb-6 transition-colors shadow-sm"
      >
        <Zap size={20} /> 
        <span>עשה כוחות ({selectedIds.size} נבחרו)</span>
      </button>

      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {allAvailableScores.map(s => {
            const isSelected = selectedIds.has(s.player.id);
            return (
              <button
                key={s.player.id}
                onClick={() => togglePlayer(s.player.id)}
                className={`p-3 rounded-xl flex flex-col justify-center items-center transition-all border-2 h-20 relative overflow-hidden ${
                  isSelected 
                    ? 'bg-blue-500 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check size={14} className="text-blue-100" />
                  </div>
                )}
                <span className={`text-center font-bold text-sm line-clamp-1`}>
                  {s.player.name}
                </span>
                {showScores && (
                  <span className={`text-xs font-mono mt-1 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                    {s.score.toFixed(1)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {generatedTeams && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">הקבוצות מוכנות!</h3>
              <button 
                onClick={() => setGeneratedTeams(null)} 
                className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">קבוצה לבנה</h3>
                  {showScores && (
                    <span className="font-mono font-bold bg-white px-2 py-1 rounded text-sm border border-slate-200 text-slate-600">
                      סה"כ: {generatedTeams.teamWhite.totalScore.toFixed(1)}
                    </span>
                  )}
                </div>
                <ul className="p-2 space-y-1">
                  {generatedTeams.teamWhite.players.slice().sort((a, b) => a.player.name.localeCompare(b.player.name, 'he')).map(p => (
                    <li key={p.player.id} className="flex justify-between items-center text-sm p-2 bg-white rounded">
                      <span className="font-bold text-slate-700">{p.player.name}</span>
                      {showScores && <span className="font-mono text-slate-400">{p.score.toFixed(1)}</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden text-white">
                <div className="bg-black p-3 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-100">קבוצה שחורה</h3>
                  {showScores && (
                    <span className="font-mono font-bold bg-slate-800 px-2 py-1 rounded text-sm border border-slate-700 text-slate-300">
                      סה"כ: {generatedTeams.teamBlack.totalScore.toFixed(1)}
                    </span>
                  )}
                </div>
                <ul className="p-2 space-y-1">
                  {generatedTeams.teamBlack.players.slice().sort((a, b) => a.player.name.localeCompare(b.player.name, 'he')).map(p => (
                    <li key={p.player.id} className="flex justify-between items-center text-sm p-2 bg-slate-900 rounded">
                      <span className="font-bold text-slate-200">{p.player.name}</span>
                      {showScores && <span className="font-mono text-slate-500">{p.score.toFixed(1)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
