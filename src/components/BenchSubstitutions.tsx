import React, { useState } from 'react';
import { PlayerScore } from '@/hooks/useGroupData';
import { suggestBenchSubstitutions } from '@/lib/teamGenerator';
import toast from 'react-hot-toast';
import { ArrowDownUp } from 'lucide-react';
import TeamAssignmentBoard from './TeamAssignmentBoard';
import GuestManager from './GuestManager';

export default function BenchSubstitutions({
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
  onAddGuest?: (name: string, score: number) => void;
  onRemoveGuest?: (id: string) => void;
  whiteTeamIds: Set<string>;
  blackTeamIds: Set<string>;
  onChangeTeams: (white: Set<string>, black: Set<string>) => void;
}) {
  const [selectedBenchIds, setSelectedBenchIds] = useState<Set<string>>(
    new Set()
  );
  const [suggestion, setSuggestion] = useState<{
    addedToWhite: PlayerScore[];
    addedToBlack: PlayerScore[];
    newWhite: PlayerScore[];
    newBlack: PlayerScore[];
  } | null>(null);

  const removeGuest = (id: string) => {
    onRemoveGuest?.(id);
    const newWhite = new Set(whiteTeamIds);
    newWhite.delete(id);
    const newBlack = new Set(blackTeamIds);
    newBlack.delete(id);
    const newBench = new Set(selectedBenchIds);
    newBench.delete(id);
    onChangeTeams(newWhite, newBlack);
    setSelectedBenchIds(newBench);
  };

  const handleSuggest = () => {
    const whiteTeam = scores
      .filter((s) => whiteTeamIds.has(s.player.id))
      .sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));
    const blackTeam = scores
      .filter((s) => blackTeamIds.has(s.player.id))
      .sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));
    const benchComingUp = scores
      .filter((s) => selectedBenchIds.has(s.player.id))
      .sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));

    if (benchComingUp.length === 0) {
      return toast.error('יש לבחור שחקנים לעלייה מהספסל.');
    }

    const result = suggestBenchSubstitutions(
      whiteTeam,
      blackTeam,
      benchComingUp
    );

    if (result) {
      onChangeTeams(
        new Set(result.newWhite.map((p) => p.player.id)),
        new Set(result.newBlack.map((p) => p.player.id))
      );
      setSelectedBenchIds(new Set());
      setSuggestion(result);
    } else {
      toast.error('לא ניתן למצוא חלוקה מאוזנת בגודל הקבוצות הנוכחי.');
    }
  };

  return (
    <div
      className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200"
      dir="rtl"
    >
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">
          עליה מהספסל
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          לחץ על שחקנים כדי לסמן עולים מהספסל או לשבץ לקבוצות, או גרור בין הסלים למטה.
        </p>
      </div>

      <button
        onClick={handleSuggest}
        className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex justify-center items-center gap-2 shadow-sm mb-6 transition-colors"
      >
        <ArrowDownUp size={20} />
        הצע חלוקה הוגנת לעולים מהספסל
      </button>

      <TeamAssignmentBoard
        scores={scores}
        showScores={showScores}
        whiteTeamIds={whiteTeamIds}
        blackTeamIds={blackTeamIds}
        comingUpIds={selectedBenchIds}
        includeComingUp={true}
        onChangeAssignment={(newWhite, newBlack, newComingUp) => {
          onChangeTeams(newWhite, newBlack);
          setSelectedBenchIds(newComingUp);
        }}
      />

      <GuestManager
        scores={scores}
        showScores={showScores}
        onAddGuest={onAddGuest}
        onRemoveGuest={removeGuest}
      />

      {suggestion && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4 text-center">
              המלצת חלוקה
            </h3>

            <div className="space-y-6 mb-8">
              {suggestion.addedToWhite.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">
                    עולים לקבוצה הלבנה:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.addedToWhite.map((p) => (
                      <span
                        key={p.player.id}
                        className="bg-white px-3 py-1.5 rounded-lg border shadow-sm font-semibold text-slate-800"
                      >
                        {p.player.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {suggestion.addedToBlack.length > 0 && (
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-white mb-2">
                    עולים לקבוצה השחורה:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.addedToBlack.map((p) => (
                      <span
                        key={p.player.id}
                        className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-600 shadow-sm font-semibold text-white"
                      >
                        {p.player.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {suggestion.addedToWhite.length === 0 &&
                suggestion.addedToBlack.length === 0 && (
                  <div className="text-center text-slate-500 py-4">
                    אין שינויים
                  </div>
                )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSuggestion(null)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-xl shadow-sm transition-colors"
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
