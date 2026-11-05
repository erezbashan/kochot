import React from 'react';
import { PlayerScore } from '@/hooks/useGroupData';
import { Shirt, Armchair, ArrowUpCircle } from 'lucide-react';

export type PlayerStatus = 'bench' | 'coming_up' | 'white' | 'black';

interface TeamAssignmentBoardProps {
  scores: PlayerScore[];
  showScores: boolean;
  whiteTeamIds: Set<string>;
  blackTeamIds: Set<string>;
  comingUpIds?: Set<string>;
  includeComingUp?: boolean;
  onChangeAssignment: (
    white: Set<string>,
    black: Set<string>,
    comingUp: Set<string>
  ) => void;
}

export default function TeamAssignmentBoard({
  scores,
  showScores,
  whiteTeamIds,
  blackTeamIds,
  comingUpIds = new Set(),
  includeComingUp = false,
  onChangeAssignment,
}: TeamAssignmentBoardProps) {
  const sortedScores = scores
    .slice()
    .sort((a, b) => a.player.name.localeCompare(b.player.name, 'he'));

  const getPlayerStatus = (id: string): PlayerStatus => {
    if (whiteTeamIds.has(id)) return 'white';
    if (blackTeamIds.has(id)) return 'black';
    if (includeComingUp && comingUpIds.has(id)) return 'coming_up';
    return 'bench';
  };

  const setPlayerStatus = (id: string, target: PlayerStatus) => {
    const newWhite = new Set(whiteTeamIds);
    const newBlack = new Set(blackTeamIds);
    const newComingUp = new Set(comingUpIds);

    newWhite.delete(id);
    newBlack.delete(id);
    newComingUp.delete(id);

    if (target === 'white') newWhite.add(id);
    else if (target === 'black') newBlack.add(id);
    else if (target === 'coming_up' && includeComingUp) newComingUp.add(id);

    onChangeAssignment(newWhite, newBlack, newComingUp);
  };

  const handlePlayerClick = (id: string) => {
    const current = getPlayerStatus(id);
    let next: PlayerStatus;

    if (includeComingUp) {
      // Cycle: bench -> coming_up -> white -> black -> bench
      if (current === 'bench') next = 'coming_up';
      else if (current === 'coming_up') next = 'white';
      else if (current === 'white') next = 'black';
      else next = 'bench';
    } else {
      // Cycle: bench -> white -> black -> bench
      if (current === 'bench') next = 'white';
      else if (current === 'white') next = 'black';
      else next = 'bench';
    }

    setPlayerStatus(id, next);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('playerId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, target: PlayerStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('playerId');
    if (!id) return;
    setPlayerStatus(id, target);
  };

  const whitePlayers = sortedScores.filter((s) => whiteTeamIds.has(s.player.id));
  const blackPlayers = sortedScores.filter((s) => blackTeamIds.has(s.player.id));
  const comingUpPlayers = sortedScores.filter(
    (s) => includeComingUp && comingUpIds.has(s.player.id)
  );
  const benchPlayers = sortedScores.filter(
    (s) =>
      !whiteTeamIds.has(s.player.id) &&
      !blackTeamIds.has(s.player.id) &&
      (!includeComingUp || !comingUpIds.has(s.player.id))
  );

  return (
    <div>
      {/* Compact Status Legend & Live Counters */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
        <span className="text-slate-600 font-medium">
          לחיצה על שחקן מחליפה מצב:{' '}
          <strong className="text-slate-800">
            {includeComingUp
              ? 'ספסל ← עולה ← לבן ← שחור'
              : 'ספסל ← לבן ← שחור'}
          </strong>
        </span>
        <div className="flex flex-wrap items-center gap-1.5 font-bold">
          {includeComingUp && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white">
              <ArrowUpCircle size={12} />
              עולים: {comingUpPlayers.length}
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-800 text-slate-900">
            <Shirt size={12} className="fill-white stroke-slate-900" />
            לבן: {whitePlayers.length}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 text-white">
            <Shirt size={12} className="fill-slate-900 stroke-white" />
            שחור: {blackPlayers.length}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
            <Armchair size={12} />
            ספסל: {benchPlayers.length}
          </span>
        </div>
      </div>

      {/* Fixed-Position Alphabetical Player Grid (Never jumps on tap) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-8">
        {sortedScores.map((s) => {
          const status = getPlayerStatus(s.player.id);

          let cardClasses = '';
          let badgeClasses = '';
          let scoreClasses = '';
          let statusLabel = '';
          let StatusIcon = Armchair;
          let iconClasses = '';

          if (status === 'white') {
            cardClasses =
              'bg-white border-2 border-slate-800 text-slate-900 shadow-sm hover:bg-slate-50';
            badgeClasses =
              'bg-slate-100 text-slate-800 border border-slate-300';
            scoreClasses = 'text-slate-500';
            statusLabel = 'לבן';
            StatusIcon = Shirt;
            iconClasses = 'text-slate-900 fill-white stroke-[2.2]';
          } else if (status === 'black') {
            cardClasses =
              'bg-slate-900 border-2 border-slate-950 text-white shadow-sm hover:bg-slate-800';
            badgeClasses =
              'bg-black text-slate-200 border border-slate-700';
            scoreClasses = 'text-slate-400';
            statusLabel = 'שחור';
            StatusIcon = Shirt;
            iconClasses = 'text-white fill-slate-950 stroke-[2]';
          } else if (status === 'coming_up') {
            cardClasses =
              'bg-indigo-600 border-2 border-indigo-700 text-white shadow-sm hover:bg-indigo-700';
            badgeClasses =
              'bg-indigo-700 text-indigo-100 border border-indigo-500';
            scoreClasses = 'text-indigo-200';
            statusLabel = 'עולה';
            StatusIcon = ArrowUpCircle;
            iconClasses = 'text-indigo-100';
          } else {
            cardClasses =
              'bg-slate-100/80 border-2 border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-100';
            badgeClasses = 'bg-slate-200/80 text-slate-500';
            scoreClasses = 'text-slate-400';
            statusLabel = 'ספסל';
            StatusIcon = Armchair;
            iconClasses = 'text-slate-400';
          }

          return (
            <button
              key={s.player.id}
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, s.player.id)}
              onClick={() => handlePlayerClick(s.player.id)}
              className={`p-2.5 rounded-xl flex flex-col justify-between items-center transition-colors h-20 relative overflow-hidden select-none cursor-pointer ${cardClasses}`}
            >
              <div className="w-full flex items-center justify-between text-[11px] font-bold px-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${badgeClasses}`}
                >
                  <StatusIcon size={12} className={iconClasses} />
                  <span>{statusLabel}</span>
                </span>
                {showScores && (
                  <span className={`font-mono text-xs ${scoreClasses}`}>
                    {s.score.toFixed(1)}
                  </span>
                )}
              </div>
              <span className="text-center font-bold text-sm line-clamp-1 w-full mt-auto pb-0.5">
                {s.player.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Team Buckets & Drag-and-Drop Zones (Placed below grid so tapping never shifts the grid) */}
      {includeComingUp && (
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'coming_up')}
          className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-4 mb-4 min-h-[110px]"
        >
          <h4 className="font-bold text-indigo-800 mb-3 flex items-center justify-between border-b border-indigo-100 pb-2">
            <span className="flex items-center gap-1.5">
              <ArrowUpCircle size={16} className="text-indigo-600" />
              <span>עולים מהספסל</span>
            </span>
            <span className="text-xs bg-indigo-100 px-2 py-1 rounded-full">
              {comingUpPlayers.length} נבחרו
            </span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {comingUpPlayers.map((s) => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                onClick={() => handlePlayerClick(s.player.id)}
                className="bg-indigo-600 text-white border border-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-indigo-700 flex items-center gap-1.5 select-none"
              >
                <ArrowUpCircle size={14} className="text-indigo-200" />
                <span>{s.player.name}</span>
                {showScores && (
                  <span className="text-xs text-indigo-200 mr-1">
                    {s.score.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
            {comingUpPlayers.length === 0 && (
              <div className="text-sm text-indigo-300 w-full text-center py-2">
                לחץ על שחקן למעלה או גרור לכאן
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* White Bucket */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'white')}
          className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-[130px]"
        >
          <h4 className="font-bold text-slate-800 mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <Shirt size={16} className="text-slate-900 fill-white stroke-[2.2]" />
              <span>קבוצה לבנה</span>
            </span>
            <span className="text-xs bg-white border border-slate-300 px-2 py-0.5 rounded-full">
              {whitePlayers.length} שחקנים
            </span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {whitePlayers.map((s) => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                onClick={() => handlePlayerClick(s.player.id)}
                className="bg-white border-2 border-slate-800 text-slate-900 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-slate-50 flex items-center gap-1.5 select-none"
              >
                <Shirt size={14} className="text-slate-900 fill-white stroke-[2.2]" />
                <span>{s.player.name}</span>
              </div>
            ))}
            {whitePlayers.length === 0 && (
              <div className="text-sm text-slate-400 w-full text-center py-3">
                לחץ על שחקן למעלה או גרור לכאן
              </div>
            )}
          </div>
        </div>

        {/* Black Bucket */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'black')}
          className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-4 min-h-[130px]"
        >
          <h4 className="font-bold text-white mb-3 flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="flex items-center gap-1.5">
              <Shirt size={16} className="text-white fill-slate-950 stroke-[2]" />
              <span>קבוצה שחורה</span>
            </span>
            <span className="text-xs bg-slate-800 text-slate-200 px-2 py-0.5 rounded-full">
              {blackPlayers.length} שחקנים
            </span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {blackPlayers.map((s) => (
              <div
                key={s.player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, s.player.id)}
                onClick={() => handlePlayerClick(s.player.id)}
                className="bg-black text-white border border-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm cursor-grab active:cursor-grabbing hover:bg-slate-800 flex items-center gap-1.5 select-none"
              >
                <Shirt size={14} className="text-white fill-slate-950 stroke-[2]" />
                <span>{s.player.name}</span>
              </div>
            ))}
            {blackPlayers.length === 0 && (
              <div className="text-sm text-slate-500 w-full text-center py-3">
                לחץ על שחקן למעלה או גרור לכאן
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bench Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'bench')}
        className="mt-4 bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-3"
      >
        <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
          <Armchair size={14} className="text-slate-400" />
          <span>על הספסל ({benchPlayers.length}):</span>
        </h4>
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {benchPlayers.map((s) => (
            <div
              key={s.player.id}
              draggable
              onDragStart={(e) => handleDragStart(e, s.player.id)}
              onClick={() => handlePlayerClick(s.player.id)}
              className="bg-white border border-dashed border-slate-300 px-2.5 py-1 rounded-lg text-xs text-slate-500 cursor-grab active:cursor-grabbing hover:border-slate-400 flex items-center gap-1 select-none"
            >
              <Armchair size={12} className="text-slate-400" />
              <span>{s.player.name}</span>
              {showScores && (
                <span className="text-[11px] text-slate-400 mr-0.5">
                  {s.score.toFixed(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
