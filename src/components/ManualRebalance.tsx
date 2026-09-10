import React, { useState } from 'react';
import { PlayerScore } from '@/lib/store';
import { rebalanceTeams, Team } from '@/lib/teamGenerator';
import { RefreshCw, ArrowLeftRight, CheckCircle2, UserPlus, X } from 'lucide-react';

export default function ManualRebalance({ scores }: { scores: PlayerScore[] }) {
  const [whiteTeamIds, setWhiteTeamIds] = useState<Set<string>>(new Set());
  const [blackTeamIds, setBlackTeamIds] = useState<Set<string>>(new Set());
  
  // Guests feature
  const [guests, setGuests] = useState<PlayerScore[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestScore, setGuestScore] = useState('50');
  
  const [rebalanceResult, setRebalanceResult] = useState<{
    swappedOutA: string,
    swappedOutB: string,
    diffBefore: number,
    diffAfter: number,
    isBalanced: boolean
  } | null>(null);

  const allAvailableScores = [...scores, ...guests];

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
    }
  };

  const removeGuest = (id: string) => {
    setGuests(guests.filter(g => g.player.id !== id));
    const newWhite = new Set(whiteTeamIds);
    newWhite.delete(id);
    setWhiteTeamIds(newWhite);
    const newBlack = new Set(blackTeamIds);
    newBlack.delete(id);
    setBlackTeamIds(newBlack);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('playerId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  };

  const handleDrop = (e: React.DragEvent, target: 'unassigned' | 'white' | 'black') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('playerId');
    if (!id) return;
    
    const newWhite = new Set(whiteTeamIds);
    const newBlack = new Set(blackTeamIds);
    
    newWhite.delete(id);
    newBlack.delete(id);
    
    if (target === 'white') newWhite.add(id);
    if (target === 'black') newBlack.add(id);
    
    setWhiteTeamIds(newWhite);
    setBlackTeamIds(newBlack);
  };

  // Click handler fallback for mobile
  const handlePlayerClick = (id: string) => {
    const newWhite = new Set(whiteTeamIds);
    const newBlack = new Set(blackTeamIds);
    
    if (!newWhite.has(id) && !newBlack.has(id)) {
      newWhite.add(id);
    } else if (newWhite.has(id)) {
      newWhite.delete(id);
      newBlack.add(id);
    } else {
      newBlack.delete(id);
    }
    
    setWhiteTeamIds(newWhite);
    setBlackTeamIds(newBlack);
  };

  const handleRebalance = () => {
    if (whiteTeamIds.size === 0 || blackTeamIds.size === 0) {
      return alert('יש להוסיף שחקנים לשתי הקבוצות.');
    }

    const whitePlayers = allAvailableScores.filter(s => whiteTeamIds.has(s.player.id));
    const blackPlayers = allAvailableScores.filter(s => blackTeamIds.has(s.player.id));
    
    const teamWhite: Team = {
      name: 'לבן',
      players: whitePlayers,
      totalScore: whitePlayers.reduce((sum, p) => sum + p.score, 0)
    };
    
    const teamBlack: Team = {
      name: 'שחור',
      players: blackPlayers,
      totalScore: blackPlayers.reduce((sum, p) => sum + p.score, 0)
    };

    const diffBefore = Math.abs(teamWhite.totalScore - teamBlack.totalScore);
    const result = rebalanceTeams(teamWhite, teamBlack);
    
    if (result) {
      const diffAfter = Math.abs(result.teamA.totalScore - result.teamB.totalScore);
      setRebalanceResult({
        swappedOutA: result.swappedOutA,
        swappedOutB: result.swappedOutB,
        diffBefore,
        diffAfter,
        isBalanced: false
      });
    } else {
      setRebalanceResult({
        swappedOutA: '', swappedOutB: '', diffBefore, diffAfter: diffBefore, isBalanced: true
      });
    }
  };

  const unassigned = allAvailableScores.filter(s => !whiteTeamIds.has(s.player.id) && !blackTeamIds.has(s.player.id));
  const whitePlayers = allAvailableScores.filter(s => whiteTeamIds.has(s.player.id));
  const blackPlayers = allAvailableScores.filter(s => blackTeamIds.has(s.player.id));

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200" dir="rtl">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">איזון מחדש ידני</h2>
      </div>

      <button 
        onClick={handleRebalance}
        className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex justify-center items-center gap-2 shadow-sm mb-6 transition-colors"
      >
        <RefreshCw size={20} /> 
        <span>הצע חילוף לאיזון קבוצות אלו</span>
      </button>

      {/* Guests Section */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 text-sm">
          <UserPlus size={16} />
          הוספת אורח
        </h3>
        <form onSubmit={addGuest} className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="שם האורח"
            className="flex-1 border border-slate-300 p-2 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <input 
              type="number" 
              value={guestScore}
              onChange={(e) => setGuestScore(e.target.value)}
              placeholder="ציון"
              className="w-20 border border-slate-300 p-2 rounded-lg text-sm text-center"
              min="0" max="100"
            />
            <button type="submit" className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              הוסף
            </button>
          </div>
        </form>
        {guests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {guests.map(g => (
              <span key={g.player.id} className="bg-white border px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2">
                {g.player.name} | {g.score}
                <button onClick={() => removeGuest(g.player.id)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* White Bucket */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'white')}
          className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-[150px]"
        >
          <h4 className="font-bold text-slate-800 mb-2 border-b pb-2">קבוצה לבנה ({whitePlayers.length})</h4>
          <div className="flex flex-wrap gap-2">
            {whitePlayers.map(s => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                onClick={() => handlePlayerClick(s.player.id)}
                className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-slate-50"
              >
                {s.player.name}
              </div>
            ))}
          </div>
        </div>

        {/* Black Bucket */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'black')}
          className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-4 min-h-[150px]"
        >
          <h4 className="font-bold text-white mb-2 border-b border-slate-700 pb-2">קבוצה שחורה ({blackPlayers.length})</h4>
          <div className="flex flex-wrap gap-2">
            {blackPlayers.map(s => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                onClick={() => handlePlayerClick(s.player.id)}
                className="bg-black text-white border border-slate-600 px-3 py-2 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-gray-800"
              >
                {s.player.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'unassigned')}
        className="mt-6 border-t pt-4"
      >
        <h4 className="text-sm font-bold text-slate-500 mb-3">שחקנים לא משובצים (גרור לקבוצות):</h4>
        <div className="flex flex-wrap gap-2">
          {unassigned.map(s => (
            <div
              key={s.player.id}
              draggable
              onDragStart={(e) => handleDragStart(e, s.player.id)}
              onClick={() => handlePlayerClick(s.player.id)}
              className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm text-slate-700 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm"
            >
              {s.player.name} <span className="text-xs text-slate-400 ml-1">{s.score.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Popup Result */}
      {rebalanceResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">תוצאת איזון</h3>
              <button 
                onClick={() => setRebalanceResult(null)} 
                className="p-1 hover:bg-slate-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 text-center">
              {rebalanceResult.isBalanced ? (
                <div>
                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">הקבוצות מאוזנות!</h3>
                  <p className="text-sm text-slate-500">הפער קטן מספיק, אין חילוף בודד שישפר משמעותית את המצב.</p>
                </div>
              ) : (
                <div>
                  <ArrowLeftRight size={48} className="text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-4">חילוף מומלץ:</h3>
                  
                  <div className="flex flex-col gap-2 mb-6">
                    <div className="bg-slate-100 p-2 rounded-lg text-sm border font-bold">
                      {rebalanceResult.swappedOutA} <span className="font-normal text-slate-500">(לשחור)</span>
                    </div>
                    <div className="text-blue-400">
                      <ArrowLeftRight size={20} className="mx-auto" />
                    </div>
                    <div className="bg-slate-900 text-white p-2 rounded-lg text-sm font-bold">
                      {rebalanceResult.swappedOutB} <span className="font-normal text-slate-400">(ללבן)</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 flex justify-center gap-4">
                    <span>פער לפני: {rebalanceResult.diffBefore.toFixed(1)}</span>
                    <span className="text-emerald-600 font-bold">פער אחרי: {rebalanceResult.diffAfter.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t">
              <button onClick={() => setRebalanceResult(null)} className="w-full bg-slate-200 text-slate-800 p-2 rounded-lg font-bold hover:bg-slate-300">
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
