import React, { useState } from 'react';
import { PlayerScore } from '@/lib/store';
import { UserPlus } from 'lucide-react';

export default function Leaderboard({ scores, onAddPlayer }: { scores: PlayerScore[], onAddPlayer: (name: string) => void }) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md" dir="rtl">
      <h2 className="text-xl md:text-2xl font-bold mb-4">טבלת מובילים (Leaderboard)</h2>
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="שם השחקן החדש..."
          className="flex-1 border p-3 md:p-2 rounded w-full text-base"
        />
        <button type="submit" className="bg-blue-600 text-white p-3 md:p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700 min-w-[80px]">
          <UserPlus size={20} />
          הוסף
        </button>
      </form>

      {scores.length === 0 ? (
        <p className="text-gray-500 italic">אין שחקנים עדיין. הוסף שחקנים למעלה!</p>
      ) : (
        <div className="space-y-2">
          {scores.map((s, index) => (
            <div key={s.player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg w-6 text-center">{index + 1}.</span>
                <span className="font-semibold text-lg">{s.player.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-blue-600 font-bold text-lg">{s.score.toFixed(1)}</span>
                <span className="text-xs text-gray-500">{s.rankingsCount} דירוגים</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
