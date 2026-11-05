import React, { useState } from 'react';
import { PlayerScore } from '@/hooks/useGroupData';
import { UserPlus, X } from 'lucide-react';

interface GuestManagerProps {
  scores: PlayerScore[];
  showScores: boolean;
  onAddGuest?: (name: string, score: number) => void;
  onRemoveGuest?: (id: string) => void;
}

export default function GuestManager({
  scores,
  showScores,
  onAddGuest,
  onRemoveGuest,
}: GuestManagerProps) {
  const [guestName, setGuestName] = useState('');
  const [guestScore, setGuestScore] = useState('50');

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim() && guestScore !== '' && !isNaN(Number(guestScore))) {
      onAddGuest?.(guestName.trim(), Number(guestScore));
      setGuestName('');
      setGuestScore('50');
    }
  };

  const guests = scores.filter((s) => s.player.isGuest);

  return (
    <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mt-8">
      <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
        <UserPlus size={16} />
        הוספת אורח
      </h3>
      <form onSubmit={handleAddGuest} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="שם האורח"
          className="flex-1 border border-slate-300 p-2 rounded-lg text-sm bg-white"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={guestScore}
            onChange={(e) => setGuestScore(e.target.value)}
            placeholder="ציון"
            className="w-20 border border-slate-300 p-2 rounded-lg text-sm text-center bg-white"
            min="0"
            max="100"
          />
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            הוסף
          </button>
        </div>
      </form>
      {guests.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {guests.map((g) => (
            <span
              key={g.player.id}
              className="bg-white border px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2"
            >
              {g.player.name}{' '}
              {showScores && (
                <>
                  <span className="text-slate-400">|</span>{' '}
                  <span className="text-blue-600">{g.score}</span>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemoveGuest?.(g.player.id)}
                className="text-slate-400 hover:text-red-500 ml-1"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
