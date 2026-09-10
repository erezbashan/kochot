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
      
      // If there are new players not in previous ranking, add them to ranked by default at bottom
      setRankedPlayers([...loadedRanked, ...loadedUnranked]);
      setUnrankedPlayers([]);
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
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 -mx-4 md:-mx-8 -mt-4 md:-mt-8 p-6 rounded-t-2xl mb-6 text-white">
        <h2 className="text-2xl font-bold">דירוג שחקנים</h2>
        <p className="opacity-80 text-sm mt-1">סדר את השחקנים מהטוב ביותר למעלה, לגרוע ביותר למטה.</p>
      </div>
      
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-sm font-bold text-gray-700 mb-2">מי אתה?</label>
        <select 
          className="w-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 rounded-lg text-base bg-white" 
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
        <div className="text-center p-8 text-gray-400 border-2 border-dashed rounded-xl">
          אנא בחר את שמך למעלה כדי להתחיל לדרג
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-lg text-gray-800">רשימה לדירוג</h3>
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{rankedPlayers.length} מדורגים</span>
            </div>
            
            <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-200 min-h-[150px]">
              {rankedPlayers.length === 0 ? (
                <p className="text-gray-400 text-center py-4 italic">אין שחקנים ברשימה. הוסף מלמטה.</p>
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
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 flex justify-center items-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <Check size={24} /> שמור דירוג
          </button>

          {unrankedPlayers.length > 0 && (
            <div className="mt-4 opacity-80">
              <h3 className="font-bold text-gray-600 mb-3 border-t pt-4">לא מכיר / לא מדרג ({unrankedPlayers.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {unrankedPlayers.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => moveToRanked(p.id)}
                    className="flex justify-between items-center bg-gray-100 hover:bg-gray-200 border border-gray-300 p-2 rounded text-sm transition-colors"
                  >
                    <span>{p.name}</span>
                    <Plus size={16} className="text-green-600" />
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
