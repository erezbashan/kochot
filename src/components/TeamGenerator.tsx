import React, { useState } from 'react';
import { PlayerScore } from '@/lib/store';
import { generateTeams, Team } from '@/lib/teamGenerator';
import { Users, UserPlus, Zap } from 'lucide-react';

export default function TeamGenerator({ scores }: { scores: PlayerScore[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Guests feature
  const [guests, setGuests] = useState<PlayerScore[]>([]);
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
  };

  const allAvailableScores = [...scores, ...guests];

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 md:-mx-10 -mt-6 md:-mt-10 p-8 rounded-t-3xl mb-8 text-white shadow-lg">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">יצירת קבוצות (כוחות)</h2>
        <p className="text-blue-100 text-lg font-medium">בחר שחקנים, הוסף אורחים וצור קבוצות מאוזנות.</p>
      </div>
      
      {/* Guests Section */}
      <div className="mb-10 p-6 rounded-2xl bg-blue-50 border-2 border-blue-100">
        <h3 className="font-extrabold text-blue-900 mb-4 flex items-center gap-2 text-xl">
          <UserPlus size={24} className="text-blue-600" />
          הוספת אורח (לא חובה)
        </h3>
        <form onSubmit={addGuest} className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="שם האורח"
            className="flex-1 border-2 border-blue-200 p-4 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
          />
          <div className="flex gap-4">
            <input 
              type="number" 
              value={guestScore}
              onChange={(e) => setGuestScore(e.target.value)}
              placeholder="ציון (0-100)"
              className="w-32 border-2 border-blue-200 p-4 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
              min="0" max="100"
            />
            <button type="submit" className="bg-blue-800 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-900 shadow-md font-black text-lg whitespace-nowrap">
              הוסף
            </button>
          </div>
        </form>
        {guests.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {guests.map(g => (
              <span key={g.player.id} className="bg-white border-2 border-blue-200 shadow-sm px-5 py-2 rounded-full text-base font-bold text-gray-700 flex items-center gap-3">
                {g.player.name} <span className="text-gray-300">|</span> <span className="text-blue-600">{g.score}</span>
                <button onClick={() => removeGuest(g.player.id)} className="text-red-500 bg-red-50 hover:bg-red-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-xl font-bold">
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-extrabold text-gray-800 text-2xl">מי משחק היום?</h3>
          <span className="bg-blue-100 text-blue-900 px-4 py-1.5 rounded-full text-lg font-black shadow-sm">
            {selectedIds.size} נבחרו
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allAvailableScores.map(s => {
            const isSelected = selectedIds.has(s.player.id);
            return (
              <button
                key={s.player.id}
                onClick={() => togglePlayer(s.player.id)}
                className={`p-4 rounded-2xl flex flex-col justify-center items-center transition-all border-4 h-32 ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-500 shadow-md transform scale-105 z-10' 
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                <span className={`text-center font-black text-xl line-clamp-1 mb-2 ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                  {s.player.name}
                </span>
                <span className={`text-lg font-mono font-bold ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                  {s.score.toFixed(1)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <button 
        onClick={handleGenerate}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl font-black text-3xl hover:from-blue-700 hover:to-indigo-700 flex justify-center items-center gap-4 shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] mb-10"
      >
        <Zap size={36} /> 
        <span>צור קבוצות מאוזנות!</span>
      </button>

      {generatedTeams && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-3xl font-black text-gray-900 mb-6">תוצאות</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border-4 border-gray-200 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-gray-100 p-6 border-b-4 border-gray-200 flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-800">קבוצה לבנה (White)</h3>
                <span className="font-mono font-black bg-white px-4 py-2 rounded-xl text-lg border-2 shadow-sm text-gray-700">
                  סה"כ: {generatedTeams.teamWhite.totalScore.toFixed(1)}
                </span>
              </div>
              <ul className="p-4 space-y-3">
                {generatedTeams.teamWhite.players.map(p => (
                  <li key={p.player.id} className="flex justify-between items-center text-xl p-4 hover:bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-100 transition-colors">
                    <span className="font-bold text-gray-800">{p.player.name}</span>
                    <span className="font-mono font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg text-lg">{p.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900 border-4 border-black rounded-3xl overflow-hidden shadow-xl text-white">
              <div className="bg-black p-6 border-b-4 border-gray-800 flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-100">קבוצה שחורה (Black)</h3>
                <span className="font-mono font-black bg-gray-800 px-4 py-2 rounded-xl text-lg border-2 border-gray-700 text-gray-300">
                  סה"כ: {generatedTeams.teamBlack.totalScore.toFixed(1)}
                </span>
              </div>
              <ul className="p-4 space-y-3">
                {generatedTeams.teamBlack.players.map(p => (
                  <li key={p.player.id} className="flex justify-between items-center text-xl p-4 hover:bg-gray-800 rounded-xl border-2 border-transparent hover:border-gray-700 transition-colors">
                    <span className="font-bold text-gray-200">{p.player.name}</span>
                    <span className="font-mono font-bold text-gray-400 bg-gray-800 px-3 py-1 rounded-lg text-lg">{p.score.toFixed(1)}</span>
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
