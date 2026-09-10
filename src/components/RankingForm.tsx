import React, { useState, useEffect } from 'react';
import { Player, Ranking } from '@/lib/store';
import { Check, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

export default function RankingForm({ 
  players, 
  onSubmitRanking, 
  getRankingForRater 
}: { 
  players: Player[], 
  onSubmitRanking: (raterId: string, rankedIds: string[]) => void,
  getRankingForRater: (raterId: string) => Ranking | undefined
}) {
  const [raterId, setRaterId] = useState('');
  const [rankedPlayers, setRankedPlayers] = useState<Player[]>([]);
  const [unrankedPlayers, setUnrankedPlayers] = useState<Player[]>([]);

  // When rater changes, load their previous ranking
  useEffect(() => {
    if (!raterId) {
      setRankedPlayers([]);
      setUnrankedPlayers([]);
      return;
    }

    const previousRanking = getRankingForRater(raterId);
    if (previousRanking) {
      const rankedIds = previousRanking.rankedPlayerIds;
      // Filter out the rater from the lists
      const otherPlayers = players.filter(p => p.id !== raterId);
      
      const loadedRanked: Player[] = [];
      rankedIds.forEach(id => {
        const p = otherPlayers.find(op => op.id === id);
        if (p) loadedRanked.push(p);
      });

      const loadedUnranked = otherPlayers.filter(p => !rankedIds.includes(p.id));
      
      setRankedPlayers(loadedRanked);
      setUnrankedPlayers(loadedUnranked);
    } else {
      // New rater - default all other players to ranked
      setRankedPlayers(players.filter(p => p.id !== raterId));
      setUnrankedPlayers([]);
    }
  }, [raterId, players, getRankingForRater]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRankedPlayers((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const moveToUnranked = (id: string) => {
    const player = rankedPlayers.find(p => p.id === id);
    if (player) {
      setRankedPlayers(rankedPlayers.filter(p => p.id !== id));
      setUnrankedPlayers([...unrankedPlayers, player]);
    }
  };

  const moveToRanked = (id: string) => {
    const player = unrankedPlayers.find(p => p.id === id);
    if (player) {
      setUnrankedPlayers(unrankedPlayers.filter(p => p.id !== id));
      setRankedPlayers([...rankedPlayers, player]);
    }
  };

  const handleSubmit = () => {
    if (!raterId) return alert('אנא בחר מי אתה למעלה.');
    if (rankedPlayers.length < 2) return alert('חייבים לדרג לפחות 2 שחקנים.');
    
    onSubmitRanking(raterId, rankedPlayers.map(p => p.id));
    alert('הדירוג נשמר בהצלחה! התוצאות עודכנו.');
  };

  if (players.length === 0) return null;

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl" dir="rtl">
      <div className="bg-gradient-to-r from-fuchsia-500 to-purple-600 -mx-6 md:-mx-10 -mt-6 md:-mt-10 p-8 rounded-t-3xl mb-8 text-white shadow-lg">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">דירוג שחקנים</h2>
        <p className="text-fuchsia-100 text-lg font-medium">סדר את השחקנים מהטוב ביותר למעלה, לגרוע ביותר למטה.</p>
      </div>
      
      <div className="mb-8 bg-purple-50 p-6 rounded-2xl border-2 border-purple-100 shadow-inner">
        <label className="block text-xl font-bold text-purple-900 mb-3">מי אתה?</label>
        <select 
          className="w-full border-2 border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-4 rounded-xl text-xl font-bold text-gray-800 bg-white" 
          value={raterId} 
          onChange={(e) => setRaterId(e.target.value)}
        >
          <option value="">בחר את שמך...</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!raterId ? (
        <div className="text-center p-12 text-purple-400 border-4 border-dashed border-purple-100 rounded-2xl text-2xl font-bold bg-white">
          אנא בחר את שמך למעלה כדי להתחיל לדרג
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          <div>
            <div className="flex justify-between items-end mb-4 px-2">
              <h3 className="font-extrabold text-2xl text-gray-800">רשימה לדירוג</h3>
              <span className="text-lg font-bold bg-purple-200 text-purple-900 px-4 py-1.5 rounded-full shadow-sm">{rankedPlayers.length} מדורגים</span>
            </div>
            
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6 rounded-2xl border-2 border-gray-200 min-h-[200px] shadow-inner">
              {rankedPlayers.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-xl font-medium italic">אין שחקנים ברשימה. הוסף מלמטה.</p>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={rankedPlayers.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rankedPlayers.map((p, index) => (
                      <SortableItem key={p.id} player={p} index={index} onRemove={moveToUnranked} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-emerald-400 to-green-600 text-white p-6 rounded-2xl font-black text-2xl hover:from-emerald-500 hover:to-green-700 flex justify-center items-center gap-3 shadow-xl hover:shadow-2xl transition-all active:scale-[0.98]"
          >
            <Check size={32} /> שמור דירוג
          </button>

          {unrankedPlayers.length > 0 && (
            <div className="mt-6 bg-rose-50 p-6 rounded-2xl border-2 border-rose-100">
              <h3 className="font-extrabold text-rose-900 text-xl mb-4 flex items-center gap-2">
                לא מכיר / לא מדרג ({unrankedPlayers.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {unrankedPlayers.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => moveToRanked(p.id)}
                    className="flex justify-between items-center bg-white hover:bg-rose-100 border-2 border-rose-200 p-4 rounded-xl text-lg font-bold text-gray-700 hover:text-rose-900 transition-colors shadow-sm"
                  >
                    <span>{p.name}</span>
                    <Plus size={24} className="text-rose-600 font-bold" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
