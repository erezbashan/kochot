import React, { useState } from 'react';
import { Player } from '@/lib/firestore';
import { UserPlus, UserMinus } from 'lucide-react';

export default function PlayersList({ 
  players, 
  onAddPlayer, 
  onRemovePlayer,
  canAdd 
}: { 
  players: Player[], 
  onAddPlayer: (name: string) => void, 
  onRemovePlayer: (id: string) => void,
  canAdd: boolean 
}) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim() && canAdd) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl border border-slate-100" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 -mx-4 md:-mx-8 -mt-4 md:-mt-8 p-6 rounded-t-2xl mb-6 text-white">
        <h2 className="text-2xl font-bold">סגל השחקנים</h2>
        <p className="opacity-90 text-sm mt-1">נהל את השחקנים הרשומים בקבוצה</p>
      </div>
      
      {canAdd && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <input 
            type="text" 
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="שם השחקן החדש..."
            className="flex-1 bg-transparent px-4 outline-none text-base font-medium placeholder:text-slate-400"
          />
          <button type="submit" className="bg-indigo-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-sm transition-colors font-bold">
            <UserPlus size={20} />
            <span className="hidden sm:inline">הוסף שחקן</span>
          </button>
        </form>
      )}

      {players.length === 0 ? (
        <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium">
          אין שחקנים במערכת עדיין.<br/>{canAdd && 'הוסף שחקנים למעלה!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {players.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border bg-white border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
              <span className="font-bold text-lg text-slate-800">
                {p.name}
              </span>
              
              {canAdd && (
                <button 
                  onClick={() => {
                    if (confirm(`האם אתה בטוח שברצונך למחוק את ${p.name}?`)) {
                      onRemovePlayer(p.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                  <UserMinus size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
