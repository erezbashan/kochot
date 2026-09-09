import React, { useState } from 'react';
import { PlayerScore } from '@/lib/store';
import { generateTeams, rebalanceTeams, Team } from '@/lib/teamGenerator';
import { Users, UserPlus, RefreshCw } from 'lucide-react';

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
      
      // Auto-select the guest
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
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mt-6" dir="rtl">
      <h2 className="text-xl md:text-2xl font-bold mb-4">יצירת קבוצות (כוחות)</h2>
      
      {/* Guests Section */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-2">הוספת אורח</h3>
        <form onSubmit={addGuest} className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="שם האורח"
            className="flex-1 border p-2 rounded"
          />
          <input 
            type="number" 
            value={guestScore}
            onChange={(e) => setGuestScore(e.target.value)}
            placeholder="ציון (0-100)"
            className="w-full sm:w-24 border p-2 rounded"
            min="0" max="100"
          />
          <button type="submit" className="bg-gray-800 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-gray-700">
            <UserPlus size={18} />
            הוסף אורח
          </button>
        </form>
        {guests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {guests.map(g => (
              <span key={g.player.id} className="bg-white border px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {g.player.name} ({g.score})
                <button onClick={() => removeGuest(g.player.id)} className="text-red-500 font-bold">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">שחקנים נוכחים ({selectedIds.size} נבחרו)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allAvailableScores.map(s => (
            <button
              key={s.player.id}
              onClick={() => togglePlayer(s.player.id)}
              className={`p-3 border rounded-lg text-base flex flex-col justify-between items-center transition-colors shadow-sm ${
                selectedIds.has(s.player.id) ? 'bg-blue-100 border-blue-500 font-bold' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-center">{s.player.name}</span>
              <span className="text-xs text-gray-500 mt-1">{s.score.toFixed(1)}</span>
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleGenerate}
        className="w-full bg-indigo-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-lg mb-6"
      >
        <Users size={24} /> עשה כוחות (יצירת קבוצות)
      </button>

      {generatedTeams && (
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">תוצאות</h3>
            <button 
              onClick={handleRebalance}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 text-sm font-semibold"
            >
              <RefreshCw size={16} /> איזון מחדש (החלפת שחקן בודד)
            </button>
          </div>
          
          {rebalanceMsg && <p className="text-sm text-blue-600 font-bold mb-4 p-2 bg-blue-50 rounded">{rebalanceMsg}</p>}

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">קבוצה לבנה (White)</h3>
                <span className="font-mono bg-white px-2 py-1 rounded text-sm border">סה"כ: {generatedTeams.teamWhite.totalScore.toFixed(1)}</span>
              </div>
              <ul className="p-2 space-y-1">
                {generatedTeams.teamWhite.players.map(p => (
                  <li key={p.player.id} className="flex justify-between text-base p-2 hover:bg-gray-50 rounded">
                    <span>{p.player.name}</span>
                    <span className="text-gray-500 text-sm">{p.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900 border-2 border-gray-900 rounded-xl overflow-hidden shadow-sm text-white">
              <div className="bg-black p-3 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-100">קבוצה שחורה (Black)</h3>
                <span className="font-mono bg-gray-800 px-2 py-1 rounded text-sm border border-gray-700">סה"כ: {generatedTeams.teamBlack.totalScore.toFixed(1)}</span>
              </div>
              <ul className="p-2 space-y-1">
                {generatedTeams.teamBlack.players.map(p => (
                  <li key={p.player.id} className="flex justify-between text-base p-2 hover:bg-gray-800 rounded">
                    <span>{p.player.name}</span>
                    <span className="text-gray-400 text-sm">{p.score.toFixed(1)}</span>
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
