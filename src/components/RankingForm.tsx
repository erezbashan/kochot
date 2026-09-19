import React, { useState, useEffect } from 'react';
import { Player, Ranking } from '@/lib/firestore';
import { User } from 'firebase/auth';
import { Check, Plus, UserPlus, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  MouseSensor,
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
import toast from 'react-hot-toast';

export default function RankingForm({ 
  groupId,
  players, 
  onSubmitRanking, 
  getRankingForRater,
  requireLogin,
  user,
  onAddPlayer,
  onRemovePlayer,
  canAdd
}: { 
  groupId: string,
  players: Player[], 
  onSubmitRanking: (raterId: string, rankedIds: string[]) => void,
  getRankingForRater: (raterId: string) => Ranking | undefined,
  requireLogin: boolean,
  user: User | null,
  onAddPlayer: (name: string) => void,
  onRemovePlayer: (id: string) => void,
  canAdd: boolean
}) {
  const [raterId, setRaterId] = useState('');
  const [rankedPlayers, setRankedPlayers] = useState<Player[]>([]);
  const [unrankedPlayers, setUnrankedPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

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

      const loadedUnranked = otherPlayers
        .filter(p => !rankedIds.includes(p.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'he'));
      
      setRankedPlayers(loadedRanked);
      setUnrankedPlayers(loadedUnranked);
    } else {
      const initialRanked = players
        .filter(p => p.id !== raterId)
        .sort((a, b) => a.name.localeCompare(b.name, 'he'));
      setRankedPlayers(initialRanked);
      setUnrankedPlayers([]);
    }
  }, [raterId, players, getRankingForRater]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
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
      return toast.error('יש להתחבר תחילה כדי לדרג.');
    }
    if (!raterId) return toast.error('אנא בחר מי אתה למעלה.');
    if (rankedPlayers.length < 2) return toast.error('חייבים לדרג לפחות 2 שחקנים.');
    
    onSubmitRanking(raterId, rankedPlayers.map(p => p.id));
    toast.success('הדירוג נשמר בהצלחה!');
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
            disabled={Boolean(user && isClaimedByUser)}
          >
            <option value="">בחר את שמך...</option>
            {players.map(p => (
              <option key={p.id} value={p.id} disabled={Boolean(p.claimedByUserId !== null && p.claimedByUserId !== user?.uid)}>
                {p.name} {p.claimedByUserId && p.claimedByUserId !== user?.uid ? '(כבר שויך למשתמש אחר)' : ''}
              </option>
            ))}
          </select>
          {user && !isClaimedByUser && raterId && (
            <p className="text-xs text-orange-600 mt-2 font-bold">שים לב: שמירה תשייך את המשתמש שלך לשחקן זה בקבוצה לתמיד.</p>
          )}
        </div>
      )}

      {canAdd && (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newPlayerName.trim()) {
              onAddPlayer(newPlayerName.trim());
              setNewPlayerName('');
            }
          }} 
          className="flex gap-2 mb-6 bg-slate-50 p-2 rounded-xl border border-slate-200"
        >
          <input 
            type="text" 
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="הוסף שחקן חדש..."
            className="flex-1 bg-transparent px-4 outline-none text-base font-medium placeholder:text-slate-400"
          />
          <button type="submit" className="bg-fuchsia-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-fuchsia-700 shadow-sm transition-colors font-bold">
            <UserPlus size={20} />
            <span className="hidden sm:inline">הוסף</span>
          </button>
        </form>
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
                הוצאו מהדירוג ({unrankedPlayers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {unrankedPlayers.map(p => (
                  <div key={p.id} className="flex items-center bg-white border border-slate-300 rounded-full shadow-sm overflow-hidden">
                    <button 
                      onClick={() => moveToRanked(p.id)}
                      className="flex items-center gap-1 hover:bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 transition-colors"
                    >
                      <span>{p.name}</span>
                      <Plus size={14} className="text-slate-400" />
                    </button>
                    {canAdd && (
                      <button 
                        onClick={() => setPlayerToDelete(p)}
                        className="px-2 py-1.5 border-r border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
                        title="מחק שחקן"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {playerToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">מחיקת שחקן</h3>
            <p className="text-slate-600 mb-6">
              האם אתה בטוח שברצונך למחוק את <strong>{playerToDelete.name}</strong> מהקבוצה?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPlayerToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={() => {
                  onRemovePlayer(playerToDelete.id);
                  setPlayerToDelete(null);
                  toast.success('שחקן נמחק מהקבוצה');
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                מחק שחקן
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
