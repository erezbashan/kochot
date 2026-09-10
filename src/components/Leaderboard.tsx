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
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl border border-slate-100" dir="rtl">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 -mx-4 md:-mx-8 -mt-4 md:-mt-8 p-6 rounded-t-2xl mb-6 text-white flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold">טבלת מובילים</h2>
          <p className="opacity-90 text-sm mt-1">דירוג השחקנים המעודכן ביותר</p>
        </div>
      </div>
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-xl border border-slate-200">
        <input 
          type="text" 
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="שם השחקן החדש..."
          className="flex-1 bg-transparent px-4 outline-none text-base font-medium placeholder:text-slate-400"
        />
        <button type="submit" className="bg-amber-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-600 shadow-sm transition-colors font-bold">
          <UserPlus size={20} />
          <span className="hidden sm:inline">הוסף שחקן</span>
        </button>
      </form>

      {scores.length === 0 ? (
        <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium">
          אין שחקנים במערכת עדיין.<br/>הוסף שחקנים למעלה!
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((s, index) => {
            const isTop3 = index < 3;
            return (
              <div 
                key={s.player.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                  index === 0 ? 'bg-amber-50 border-amber-200 shadow-sm' : 
                  index === 1 ? 'bg-slate-50 border-slate-300' :
                  index === 2 ? 'bg-orange-50 border-orange-200' :
                  'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-black text-xl w-8 text-center ${
                    index === 0 ? 'text-amber-500' : 
                    index === 1 ? 'text-slate-500' :
                    index === 2 ? 'text-orange-600' :
                    'text-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`font-bold text-lg ${isTop3 ? 'text-slate-900' : 'text-slate-700'}`}>
                    {s.player.name}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-black text-xl ${isTop3 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {s.score.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {s.rankingsCount} דירוגים
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
