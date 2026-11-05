import React, { useState } from 'react';
import { PlayerScore } from '@/hooks/useGroupData';
import { rebalanceTeams, Team } from '@/lib/teamGenerator';
import { RefreshCw, ArrowLeftRight, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import TeamAssignmentBoard from './TeamAssignmentBoard';
import GuestManager from './GuestManager';

export default function ManualRebalance({
  scores,
  showScores,
  onAddGuest,
  onRemoveGuest,
  whiteTeamIds,
  blackTeamIds,
  onChangeTeams,
}: {
  scores: PlayerScore[];
  showScores: boolean;
  onAddGuest: (name: string, score: number) => void;
  onRemoveGuest: (id: string) => void;
  whiteTeamIds: Set<string>;
  blackTeamIds: Set<string>;
  onChangeTeams: (white: Set<string>, black: Set<string>) => void;
}) {
  const [rebalanceResult, setRebalanceResult] = useState<{
    swappedOutA: string;
    swappedOutB: string;
    diffBefore: number;
    diffAfter: number;
    isBalanced: boolean;
  } | null>(null);

  const removeGuest = (id: string) => {
    onRemoveGuest(id);
    const newWhite = new Set(whiteTeamIds);
    newWhite.delete(id);
    const newBlack = new Set(blackTeamIds);
    newBlack.delete(id);
    onChangeTeams(newWhite, newBlack);
  };

  const handleRebalance = () => {
    const whitePlayers = scores
      .filter((s) => whiteTeamIds.has(s.player.id))
      .sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));
    const blackPlayers = scores
      .filter((s) => blackTeamIds.has(s.player.id))
      .sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));

    if (whitePlayers.length === 0 || blackPlayers.length === 0) {
      return toast.error('יש להוסיף שחקנים לשתי הקבוצות.');
    }

    const teamWhite: Team = {
      name: 'לבן',
      players: whitePlayers,
      totalScore: whitePlayers.reduce((sum, p) => sum + p.score, 0),
    };

    const teamBlack: Team = {
      name: 'שחור',
      players: blackPlayers,
      totalScore: blackPlayers.reduce((sum, p) => sum + p.score, 0),
    };

    const diffBefore = Math.abs(teamWhite.totalScore - teamBlack.totalScore);
    const result = rebalanceTeams(teamWhite, teamBlack);

    if (result) {
      const diffAfter = Math.abs(
        result.teamA.totalScore - result.teamB.totalScore
      );

      // Apply the swap
      const newWhite = new Set(whiteTeamIds);
      const newBlack = new Set(blackTeamIds);

      const whitePlayerId = whitePlayers.find(
        (p) => p.player.name === result.swappedOutA
      )?.player.id;
      const blackPlayerId = blackPlayers.find(
        (p) => p.player.name === result.swappedOutB
      )?.player.id;

      if (whitePlayerId && blackPlayerId) {
        newWhite.delete(whitePlayerId);
        newWhite.add(blackPlayerId);

        newBlack.delete(blackPlayerId);
        newBlack.add(whitePlayerId);

        onChangeTeams(newWhite, newBlack);
      }

      setRebalanceResult({
        swappedOutA: result.swappedOutA,
        swappedOutB: result.swappedOutB,
        diffBefore,
        diffAfter,
        isBalanced: false,
      });
    } else {
      setRebalanceResult({
        swappedOutA: '',
        swappedOutB: '',
        diffBefore,
        diffAfter: diffBefore,
        isBalanced: true,
      });
    }
  };

  return (
    <div
      className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200"
      dir="rtl"
    >
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">
          איזון מחדש
        </h2>
      </div>

      <button
        onClick={handleRebalance}
        className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex justify-center items-center gap-2 shadow-sm mb-6 transition-colors"
      >
        <RefreshCw size={20} />
        <span>הצע חילוף לאיזון קבוצות אלו</span>
      </button>

      <TeamAssignmentBoard
        scores={scores}
        showScores={showScores}
        whiteTeamIds={whiteTeamIds}
        blackTeamIds={blackTeamIds}
        includeComingUp={false}
        onChangeAssignment={(newWhite, newBlack) =>
          onChangeTeams(newWhite, newBlack)
        }
      />

      <GuestManager
        scores={scores}
        showScores={showScores}
        onAddGuest={onAddGuest}
        onRemoveGuest={removeGuest}
      />

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
                  <CheckCircle2
                    size={48}
                    className="text-emerald-500 mx-auto mb-4"
                  />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    הקבוצות מאוזנות!
                  </h3>
                  <p className="text-sm text-slate-500">
                    הפער קטן מספיק, אין חילוף בודד שישפר משמעותית את המצב.
                  </p>
                </div>
              ) : (
                <div>
                  <ArrowLeftRight
                    size={48}
                    className="text-blue-500 mx-auto mb-4"
                  />
                  <h3 className="text-xl font-bold text-slate-800 mb-4">
                    חילוף מומלץ:
                  </h3>

                  <div className="flex flex-col gap-2 mb-6">
                    <div className="bg-slate-100 p-2 rounded-lg text-sm border font-bold">
                      {rebalanceResult.swappedOutA}{' '}
                      <span className="font-normal text-slate-500">(לשחור)</span>
                    </div>
                    <div className="text-blue-400">
                      <ArrowLeftRight size={20} className="mx-auto" />
                    </div>
                    <div className="bg-slate-900 text-white p-2 rounded-lg text-sm font-bold">
                      {rebalanceResult.swappedOutB}{' '}
                      <span className="font-normal text-slate-400">(ללבן)</span>
                    </div>
                  </div>

                  {showScores && (
                    <div className="text-xs text-slate-500 flex justify-center gap-4">
                      <span>
                        פער לפני: {rebalanceResult.diffBefore.toFixed(1)}
                      </span>
                      <span className="text-emerald-600 font-bold">
                        פער אחרי: {rebalanceResult.diffAfter.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t">
              <button
                onClick={() => setRebalanceResult(null)}
                className="w-full bg-slate-200 text-slate-800 p-2 rounded-lg font-bold hover:bg-slate-300"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
