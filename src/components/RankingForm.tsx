import React, { useState } from 'react';
import { Player } from '@/lib/store';
import { X, Check } from 'lucide-react';

export default function RankingForm({ players, onSubmitRanking }: { players: Player[], onSubmitRanking: (raterId: string, rankedIds: string[]) => void }) {
  const [raterId, setRaterId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  
  const unselectedPlayers = players.filter(p => !selectedPlayers.find(sp => sp.id === p.id));

  const addPlayerToRank = (p: Player) => {
    setSelectedPlayers([...selectedPlayers, p]);
  };

  const removePlayerFromRank = (id: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== id));
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSelected = [...selectedPlayers];
      const temp = newSelected[index];
      newSelected[index] = newSelected[index - 1];
      newSelected[index - 1] = temp;
      setSelectedPlayers(newSelected);
    } else if (direction === 'down' && index < selectedPlayers.length - 1) {
      const newSelected = [...selectedPlayers];
      const temp = newSelected[index];
      newSelected[index] = newSelected[index + 1];
      newSelected[index + 1] = temp;
      setSelectedPlayers(newSelected);
    }
  };

  const handleSubmit = () => {
    if (!raterId) return alert('אנא בחר מי אתה.');
    if (selectedPlayers.length < 2) return alert('אנא בחר לפחות 2 שחקנים לדירוג.');
    
    onSubmitRanking(raterId, selectedPlayers.map(p => p.id));
    setSelectedPlayers([]);
    alert('הדירוג נשלח בהצלחה!');
  };

  if (players.length === 0) return null;

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md" dir="rtl">
      <h2 className="text-xl md:text-2xl font-bold mb-4">שלח דירוג</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">מי אתה?</label>
        <select 
          className="w-full border p-3 rounded text-base" 
          value={raterId} 
          onChange={(e) => setRaterId(e.target.value)}
        >
          <option value="">בחר את שמך...</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">שחקנים לבחירה</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50">
            {unselectedPlayers.length === 0 && <p className="text-gray-500 text-sm">כל השחקנים נבחרו.</p>}
            {unselectedPlayers.map(p => (
              <button 
                key={p.id} 
                onClick={() => addPlayerToRank(p)}
                className="w-full text-right p-3 hover:bg-gray-200 rounded text-base flex justify-between items-center bg-white border border-gray-100 shadow-sm"
              >
                <span>{p.name}</span>
                <span className="text-blue-500 font-bold text-xl">+</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">מדורגים (1 = הכי טוב, למטה = הכי גרוע)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto p-1">
            {selectedPlayers.length === 0 && <p className="text-gray-500 text-sm italic">הוסף שחקנים מהרשימה.</p>}
            {selectedPlayers.map((p, index) => (
              <div key={p.id} className="flex items-center gap-2 p-3 bg-white border rounded shadow-sm">
                <span className="font-bold w-6 text-center">{index + 1}</span>
                <span className="flex-1 text-base">{p.name}</span>
                <div className="flex flex-col gap-1 px-2 border-x border-gray-200">
                  <button disabled={index === 0} onClick={() => movePlayer(index, 'up')} className="text-gray-400 hover:text-black disabled:opacity-30 p-1">▲</button>
                  <button disabled={index === selectedPlayers.length - 1} onClick={() => movePlayer(index, 'down')} className="text-gray-400 hover:text-black disabled:opacity-30 p-1">▼</button>
                </div>
                <button onClick={() => removePlayerFromRank(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={20}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        className="mt-8 w-full bg-green-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-green-700 flex justify-center items-center gap-2 shadow-lg"
      >
        <Check size={24} /> שלח דירוג
      </button>
    </div>
  );
}
