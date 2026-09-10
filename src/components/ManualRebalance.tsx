import React, { useState } from 'react';
import { PlayerScore } from '@/lib/store';
import { rebalanceTeams, Team } from '@/lib/teamGenerator';
import { RefreshCw, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export default function ManualRebalance({ scores }: { scores: PlayerScore[] }) {
  const [whiteTeamIds, setWhiteTeamIds] = useState<Set<string>>(new Set());
  const [blackTeamIds, setBlackTeamIds] = useState<Set<string>>(new Set());
  
  const [rebalanceResult, setRebalanceResult] = useState<{
    swappedOutA: string,
    swappedOutB: string,
    diffBefore: number,
    diffAfter: number
  } | null>(null);
  
  const [isBalanced, setIsBalanced] = useState(false);

  const handlePlayerClick = (id: string) => {
    const newWhite = new Set(whiteTeamIds);
    const newBlack = new Set(blackTeamIds);
    
    // Cycle state: Unassigned -> White -> Black -> Unassigned
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
    setRebalanceResult(null);
    setIsBalanced(false);
  };

  const handleRebalance = () => {
    if (whiteTeamIds.size === 0 || blackTeamIds.size === 0) {
      return alert('יש להוסיף שחקנים לשתי הקבוצות.');
    }

    const whitePlayers = scores.filter(s => whiteTeamIds.has(s.player.id));
    const blackPlayers = scores.filter(s => blackTeamIds.has(s.player.id));
    
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
        diffAfter
      });
      setIsBalanced(false);
    } else {
      setRebalanceResult(null);
      setIsBalanced(true);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl border border-gray-100" dir="rtl">
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 -mx-6 md:-mx-10 -mt-6 md:-mt-10 p-8 rounded-t-3xl mb-8 text-white shadow-lg">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">איזון קבוצות קיימות</h2>
        <p className="text-teal-100 text-lg font-medium">הזן קבוצות שחילקתם בעצמכם, והמערכת תציע חילוף בודד כדי לאזן אותן.</p>
      </div>

      <div className="mb-10">
        <h3 className="font-extrabold text-gray-800 text-2xl mb-4">בחר שחקנים:</h3>
        <p className="text-gray-500 font-bold mb-6">לחץ על שחקן כדי להעביר אותו לקבוצה הלבנה, לחץ שוב לקבוצה השחורה.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {scores.map(s => {
            const isWhite = whiteTeamIds.has(s.player.id);
            const isBlack = blackTeamIds.has(s.player.id);
            
            return (
              <button
                key={s.player.id}
                onClick={() => handlePlayerClick(s.player.id)}
                className={`p-4 rounded-2xl flex flex-col justify-center items-center transition-all border-4 h-32 ${
                  isWhite 
                    ? 'bg-gray-100 border-gray-300 shadow-md transform scale-105 z-10' 
                    : isBlack
                    ? 'bg-gray-900 border-black shadow-md transform scale-105 z-10 text-white'
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                <span className={`text-center font-black text-xl line-clamp-1 mb-2 ${isWhite ? 'text-gray-800' : isBlack ? 'text-white' : 'text-gray-700'}`}>
                  {s.player.name}
                </span>
                <span className={`text-lg font-mono font-bold ${isWhite ? 'text-gray-500' : isBlack ? 'text-gray-400' : 'text-gray-400'}`}>
                  {isWhite ? 'לבן' : isBlack ? 'שחור' : 'לא נבחר'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 bg-gray-100 border-4 border-gray-200 p-6 rounded-2xl text-center">
          <h4 className="text-2xl font-black text-gray-800 mb-2">קבוצה לבנה</h4>
          <span className="text-3xl font-mono font-bold text-gray-500">{whiteTeamIds.size}</span>
        </div>
        <div className="flex-1 bg-gray-900 border-4 border-black p-6 rounded-2xl text-center">
          <h4 className="text-2xl font-black text-white mb-2">קבוצה שחורה</h4>
          <span className="text-3xl font-mono font-bold text-gray-400">{blackTeamIds.size}</span>
        </div>
      </div>

      <button 
        onClick={handleRebalance}
        className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6 rounded-2xl font-black text-3xl hover:from-teal-600 hover:to-emerald-700 flex justify-center items-center gap-4 shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] mb-10"
      >
        <RefreshCw size={36} /> 
        <span>הצע חילוף לאיזון!</span>
      </button>

      {isBalanced && (
        <div className="bg-emerald-50 border-4 border-emerald-400 p-8 rounded-3xl text-center shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
          <h3 className="text-3xl font-black text-emerald-800 mb-2">הקבוצות מאוזנות!</h3>
          <p className="text-xl font-bold text-emerald-600">אין צורך להחליף אף שחקן. הפער קטן מספיק.</p>
        </div>
      )}

      {rebalanceResult && (
        <div className="bg-blue-50 border-4 border-blue-400 p-8 rounded-3xl text-center shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <ArrowLeftRight size={64} className="text-blue-500 mx-auto mb-4" />
          <h3 className="text-3xl font-black text-blue-900 mb-6">חילוף מומלץ:</h3>
          
          <div className="flex items-center justify-center gap-6 mb-8 text-2xl font-bold">
            <div className="bg-white border-4 border-gray-200 px-6 py-4 rounded-2xl text-gray-800 shadow-md">
              {rebalanceResult.swappedOutA} <span className="text-sm block text-gray-500">(מלבן לשחור)</span>
            </div>
            <ArrowLeftRight size={32} className="text-blue-400" />
            <div className="bg-gray-900 border-4 border-black px-6 py-4 rounded-2xl text-white shadow-md">
              {rebalanceResult.swappedOutB} <span className="text-sm block text-gray-400">(משחור ללבן)</span>
            </div>
          </div>
          
          <div className="flex justify-center gap-8 text-lg font-bold">
            <div className="text-gray-500">
              פער לפני: <span className="text-rose-500 font-black text-2xl">{rebalanceResult.diffBefore.toFixed(1)}</span>
            </div>
            <div className="text-gray-500">
              פער אחרי: <span className="text-emerald-600 font-black text-2xl">{rebalanceResult.diffAfter.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
