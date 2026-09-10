import React, { useState } from 'react';
import { PlayerScore } from '@/lib/store';
import { generateTeams, rebalanceTeams, Team } from '@/lib/teamGenerator';
import { Users, UserPlus, RefreshCw, Zap } from 'lucide-react';

export default function TeamGenerator({ scores }: { scores: PlayerScore[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Guests feature
  const [guests, setGuests] = useState<PlayerScore[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestScore, setGuestScore] = useState('50');

  const [generatedTeams, setGeneratedTeams] = useState<{teamWhite: Team, teamBlack: Team} | null>(null);
  const [rebalanceMsg, setRebalanceMsg] = useState('');

  const togglePlayer = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setGeneratedTeams(null);
  };

  const addGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim() && !isNaN(Number(guestScore))) {
      const newGuest: PlayerScore = {
        player: { id: `guest-${Date.now()}`, name: `${guestName.trim()} (אורח)` },
        score: Number(guestScore),
        rankingsCount: 0
      };
      setGuests([...guests, newGuest]);
      setGuestName('');
      setGuestScore('50');
      
      const newSet = new Set(selectedIds);
      newSet.add(newGuest.player.id);
      setSelectedIds(newSet);
    }
  };

  const removeGuest = (id: string) => {
    setGuests(guests.filter(g => g.player.id !== id));
    const newSet = new Set(selectedIds);
    newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleGenerate = () => {
    if (selectedIds.size % 2 !== 0) {
      return alert('יש לבחור מספר זוגי של שחקנים.');
    }
    if (selectedIds.size === 0) {
      return alert('יש לבחור שחקנים כדי ליצור קבוצות.');
    }

    const allScores = [...scores, ...guests];
    const selectedPlayers = allScores.filter(s => selectedIds.has(s.player.id));
    
    const teams = generateTeams(selectedPlayers);
    setGeneratedTeams(teams);
    setRebalanceMsg('');
  };

  const handleRebalance = () => {
    if (!generatedTeams) return;
    const newTeams = rebalanceTeams(generatedTeams.teamWhite, generatedTeams.teamBlack);
    if (newTeams) {
      setGeneratedTeams({ teamWhite: newTeams.teamA, teamBlack: newTeams.teamB });
      setRebalanceMsg(`הוחלפו: ${newTeams.swappedOutA} ו-${newTeams.swappedOutB}`);
    } else {
      setRebalanceMsg('לא נמצא חילוף בודד שמשפר את האיזון.');
    }
  };

  const allAvailableScores = [...scores, ...guests];

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl border border-slate-100" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 -mx-4 md:-mx-8 -mt-4 md:-mt-8 p-6 rounded-t-2xl mb-6 text-white flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">יצירת קבוצות (כוחות)</h2>
          <p className="opacity-90 text-sm mt-1">בחר שחקנים, הוסף אורחים וצור קבוצות מאוזנות</p>
        </div>
      </div>
      
      {/* Guests Section */}
      <div className="mb-8 p-5 rounded-xl bg-slate-50 border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <UserPlus size={18} className="text-indigo-500" />
          הוספת אורח (לא חובה)
        </h3>
        <form onSubmit={addGuest} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="שם האורח"
            className="flex-1 border-slate-300 p-3 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="flex gap-3">
            <input 
              type="number" 
              value={guestScore}
              onChange={(e) => setGuestScore(e.target.value)}
              placeholder="ציון (0-100)"
              className="w-24 border-slate-300 p-3 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              min="0" max="100"
            />
            <button type="submit" className="bg-slate-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-700 shadow-md font-bold whitespace-nowrap">
              הוסף
            </button>
          </div>
        </form>
        {guests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {guests.map(g => (
              <span key={g.player.id} className="bg-white border border-slate-300 shadow-sm px-4 py-2 rounded-full text-sm font-semibold text-slate-700 flex items-center gap-3">
                {g.player.name} <span className="text-slate-400">|</span> <span className="text-indigo-600">{g.score}</span>
                <button onClick={() => removeGuest(g.player.id)} className="text-red-500 bg-red-50 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center transition-colors">
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-slate-800 text-lg">מי משחק היום?</h3>
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
            {selectedIds.size} נבחרו
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allAvailableScores.map(s => {
            const isSelected = selectedIds.has(s.player.id);
            return (
              <button
                key={s.player.id}
                onClick={() => togglePlayer(s.player.id)}
                className={`p-3 rounded-xl text-base flex flex-col justify-center items-center transition-all border-2 h-24 ${
                  isSelected 
                    ? 'bg-indigo-50 border-indigo-500 shadow-sm transform scale-[0.98]' 
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <span className={`text-center font-bold line-clamp-1 ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {s.player.name}
                </span>
                <span className={`text-sm mt-1 font-mono ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {s.score.toFixed(1)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <button 
        onClick={handleGenerate}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-5 rounded-xl font-black text-xl hover:from-indigo-700 hover:to-violet-700 flex justify-center items-center gap-3 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] mb-8"
      >
        <Zap size={24} /> 
        <span>צור קבוצות מאוזנות!</span>
      </button>

      {generatedTeams && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-2xl font-black text-slate-900">תוצאות</h3>
            <button 
              onClick={handleRebalance}
              className="bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 hover:text-slate-900 text-sm font-bold shadow-sm transition-colors w-full sm:w-auto justify-center"
            >
              <RefreshCw size={16} /> איזון מחדש (החלפת שחקן בודד)
            </button>
          </div>
          
          {rebalanceMsg && (
            <div className="text-sm text-indigo-700 font-bold mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
              <RefreshCw size={18} className="animate-spin-slow" />
              {rebalanceMsg}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-md">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">קבוצה לבנה (White)</h3>
                <span className="font-mono font-bold bg-white px-3 py-1.5 rounded-lg text-sm border shadow-sm text-slate-700">
                  סה"כ: {generatedTeams.teamWhite.totalScore.toFixed(1)}
                </span>
              </div>
              <ul className="p-3 space-y-2">
                {generatedTeams.teamWhite.players.map(p => (
                  <li key={p.player.id} className="flex justify-between items-center text-base p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                    <span className="font-bold text-slate-700">{p.player.name}</span>
                    <span className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded text-sm">{p.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-md text-white">
              <div className="bg-black p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-100">קבוצה שחורה (Black)</h3>
                <span className="font-mono font-bold bg-slate-800 px-3 py-1.5 rounded-lg text-sm border border-slate-700 text-slate-300">
                  סה"כ: {generatedTeams.teamBlack.totalScore.toFixed(1)}
                </span>
              </div>
              <ul className="p-3 space-y-2">
                {generatedTeams.teamBlack.players.map(p => (
                  <li key={p.player.id} className="flex justify-between items-center text-base p-3 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                    <span className="font-bold text-slate-200">{p.player.name}</span>
                    <span className="font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded text-sm">{p.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
