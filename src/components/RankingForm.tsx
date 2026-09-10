import React, { useState, useEffect } from 'react';
import { Player, Ranking } from '@/lib/firestore';
import { User } from 'firebase/auth';
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
  groupId,
  players, 
  onSubmitRanking, 
  getRankingForRater,
  requireLogin,
  user
}: { 
  groupId: string,
  players: Player[], 
  onSubmitRanking: (raterId: string, rankedIds: string[]) => void,
  getRankingForRater: (raterId: string) => Ranking | undefined,
  requireLogin: boolean,
  user: User | null
}) {
  const [raterId, setRaterId] = useState('');
  const [rankedPlayers, setRankedPlayers] = useState<Player[]>([]);
  const [unrankedPlayers, setUnrankedPlayers] = useState<Player[]>([]);

  // If requireLogin, automatically set raterId if they claimed a player
  useEffect(() => {
    if (user) {
      const claimedPlayer = players.find(p => p.claimedByUserId === user.uid);
      if (claimedPlayer) {
        setRaterId(claimedPlayer.id);
        return;
      }
    }
    
    // Fallback to local storage for anonymous or uncliamed memory
    const saved = localStorage.getItem(`kochot_${groupId}_raterId`);
    if (saved && players.some(p => p.id === saved)) {
      setRaterId(saved);
    }
  }, [user, players, groupId]);

  useEffect(() => {
    if (!raterId) {
      setRankedPlayers([]);
      setUnrankedPlayers([]);
      return;
    }

    const previousRanking = getRankingForRater(raterId);
    if (previousRanking) {
      const rankedIds = previousRanking.rankedPlayerIds;
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
      setRankedPlayers(players.filter(p => p.id !== raterId));
      setUnrankedPlayers([]);
    }
  }, [raterId, players, getRankingForRater]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
    if (requireLogin && !user) {
      return alert('יש להתחבר תחילה כדי לדרג.');
    }
    if (!raterId) return alert('אנא בחר מי אתה למעלה.');
    if (rankedPlayers.length < 2) return alert('חייבים לדרג לפחות 2 שחקנים.');
    
    onSubmitRanking(raterId, rankedPlayers.map(p => p.id));
    alert('הדירוג נשמר בהצלחה!');
  };

  if (players.length === 0) return null;

  const isClaimedByUser = user && players.find(p => p.claimedByUserId === user.uid)?.id === raterId;

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl border border-slate-100" dir="rtl">
      <div className="bg-gradient-to-r from-fuchsia-500 to-purple-600 -mx-4 md:-mx-8 -mt-4 md:-mt-8 p-6 rounded-t-2xl mb-6 text-white">
        <h2 className="text-2xl font-bold">דירוג שחקנים</h2>
        <p className="opacity-90 text-sm mt-1">סדר את השחקנים מהטוב ביותר למעלה</p>
      </div>
      
      {requireLogin && !user ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-6 font-bold text-center">
          מנהל הקבוצה הגדיר כי חובה להתחבר כדי לדרג. אנא חזור לעמוד הקבוצה והתחבר.
        </div>
      ) : (
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">מי אתה?</label>
          <select 
            className="w-full border border-slate-300 focus:border-purple-500 focus:ring-purple-500 p-3 rounded-lg text-base font-bold text-slate-800 bg-white disabled:bg-slate-100" 
            value={raterId} 
            onChange={(e) => setRaterId(e.target.value)}
            disabled={Boolean(requireLogin && isClaimedByUser)}
          >
            <option value="">בחר את שמך...</option>
            {players.map(p => (
              <option key={p.id} value={p.id} disabled={Boolean(requireLogin && p.claimedByUserId !== null && p.claimedByUserId !== user?.uid)}>
                {p.name} {requireLogin && p.claimedByUserId && p.claimedByUserId !== user?.uid ? '(כבר שויך למישהו אחר)' : ''}
              </option>
            ))}
          </select>
          {requireLogin && !isClaimedByUser && raterId && (
            <p className="text-xs text-orange-600 mt-2 font-bold">שים לב: שמירה תשייך את המשתמש שלך לשחקן זה לתמיד.</p>
          )}
        </div>
      )}

      {!raterId ? (
        <div className="text-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl font-bold">
          בחר את שמך למעלה כדי להתחיל לדרג
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-slate-800">רשימה לדירוג ({rankedPlayers.length})</h3>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 min-h-[150px]">
              {rankedPlayers.length === 0 ? (
                <p className="text-slate-400 text-center py-6 text-sm font-medium">אין שחקנים ברשימה. הוסף מלמטה.</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={rankedPlayers.map(p => p.id)} strategy={verticalListSortingStrategy}>
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
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 flex justify-center items-center gap-2 shadow-sm transition-colors"
          >
            <Check size={20} /> שמור דירוג
          </button>

          {unrankedPlayers.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="font-bold text-slate-500 mb-3 text-sm">
                לא מכיר / לא מדרג ({unrankedPlayers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {unrankedPlayers.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => moveToRanked(p.id)}
                    className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-full text-sm font-bold text-slate-700 transition-colors shadow-sm"
                  >
                    <span>{p.name}</span>
                    <Plus size={14} className="text-slate-400" />
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
