import React, { useState } from 'react';
import { Group, updateGroupSettings, addPlayerToGroupWithId, cleanupDatabase, Player, Ranking } from '@/lib/firestore';
import toast from 'react-hot-toast';

export default function GroupSettingsPanel({ group, rankings, players, groupId }: { group: Group, rankings: Ranking[], players: Player[], groupId: string }) {
  const [recoverName, setRecoverName] = useState('');
  
  const toggleSetting = async (key: keyof typeof group.settings) => {
    const newValue = !group.settings[key];
    await updateGroupSettings(group.id, { [key]: newValue });
  };

  // Find missing IDs (IDs in rankings that are not in players)
  const playerIds = new Set(players.map(p => p.id));
  const missingIds = new Set<string>();
  rankings.forEach(r => {
    if (!playerIds.has(r.raterId)) missingIds.add(r.raterId);
    r.rankedPlayerIds.forEach(id => {
      if (!playerIds.has(id)) missingIds.add(id);
    });
  });

  const handleRecover = async (id: string) => {
    if (!recoverName.trim()) {
      return toast.error('יש להזין שם כדי לשחזר');
    }
    await addPlayerToGroupWithId(groupId, recoverName.trim(), id);
    toast.success('השחקן שוחזר בהצלחה!');
    setRecoverName('');
  };

  const handleBackup = () => {
    // Map rankings to include names
    const enrichedRankings = rankings.map(r => {
      const raterName = players.find(p => p.id === r.raterId)?.name || r.raterId;
      const rankedNames = r.rankedPlayerIds.map(id => players.find(p => p.id === id)?.name || id);
      return {
        ...r,
        raterName,
        rankedNames
      };
    });

    const backupData = {
      group,
      players,
      rankings: enrichedRankings,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kochot_backup_${group.name}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('גיבוי הורד בהצלחה!');
  };

  const handleCleanup = async () => {
    try {
      await cleanupDatabase(groupId, rankings, players);
      toast.success('הניקוי הושלם בהצלחה!');
    } catch (e) {
      console.error(e);
      toast.error('שגיאה בניקוי הנתונים');
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-slate-100" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">הגדרות קבוצה (למנהלים בלבד)</h2>
        <div className="flex gap-2">
          <button onClick={handleCleanup} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700">
            נקה נתונים (DEL1, DEL2, DEL3)
          </button>
          <button onClick={handleBackup} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-700">
            גיבוי נתונים
          </button>
        </div>
      </div>
      
      <div className="space-y-4 mb-10">
        <label className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer">
          <input 
            type="checkbox" 
            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
            checked={group.settings.showRanking}
            onChange={() => toggleSetting('showRanking')}
          />
          <div>
            <div className="font-bold text-slate-800">הצג דירוג (Show Ranking)</div>
            <div className="text-sm text-slate-500">אם דלוק, ציוני השחקנים וטבלת המובילים יהיו גלויים לכולם.</div>
          </div>
        </label>

        <label className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer">
          <input 
            type="checkbox" 
            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
            checked={group.settings.requireLoginToRank}
            onChange={() => toggleSetting('requireLoginToRank')}
          />
          <div>
            <div className="font-bold text-slate-800">דרוש התחברות לדירוג</div>
            <div className="text-sm text-slate-500">אם דלוק, משתמשים חייבים להתחבר כדי לדרג שחקנים. ההתחברות תשויך לשחקן שיבחרו.</div>
          </div>
        </label>

        <label className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer">
          <input 
            type="checkbox" 
            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
            checked={group.settings.strictAdmin}
            onChange={() => toggleSetting('strictAdmin')}
          />
          <div>
            <div className="font-bold text-slate-800">ניהול קפדני (Strict Admin)</div>
            <div className="text-sm text-slate-500">אם דלוק, רק מנהלים יכולים להוסיף שחקנים.</div>
          </div>
        </label>
      </div>

      {missingIds.size > 0 && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h3 className="text-xl font-bold mb-4 text-red-800">שחזור שחקנים שנמחקו בטעות</h3>
          <p className="text-red-700 text-sm mb-4">
            המערכת זיהתה דירוגים עבור {missingIds.size} שחקנים שנמחקו מהקבוצה. 
            ניתן לשחזר אותם כדי להחזיר להם את הדירוגים שניתנו להם (או שהם נתנו). 
            <strong> היעזר ברמזים כדי לזהות מי זה מי.</strong>
          </p>
          <div className="space-y-4">
            {Array.from(missingIds).map(id => {
              let hint = 'אין רמזים זמינים.';
              const rankedByThem = rankings.find(r => r.raterId === id);
              if (rankedByThem && rankedByThem.rankedPlayerIds.length > 0) {
                const topRanked = rankedByThem.rankedPlayerIds.slice(0, 3).map(pid => players.find(p => p.id === pid)?.name).filter(Boolean);
                if (topRanked.length > 0) {
                  hint = `דירג/ה את: ${topRanked.join(', ')} בטופ`;
                }
              } else {
                const rankedThem = rankings.filter(r => r.rankedPlayerIds.includes(id)).map(r => players.find(p => p.id === r.raterId)?.name).filter(Boolean);
                if (rankedThem.length > 0) {
                  hint = `דורג/ה על ידי: ${rankedThem.slice(0, 3).join(', ')}`;
                }
              }

              return (
                <div key={id} className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-red-200">
                  <div className="text-xs text-slate-500 font-bold bg-slate-100 p-1 rounded w-fit">רמז: {hint}</div>
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-xs text-slate-400 w-24 truncate">{id}</span>
                    <input 
                      type="text" 
                      placeholder="הזן את שם השחקן לשחזור..."
                      className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm"
                      onChange={(e) => setRecoverName(e.target.value)}
                    />
                    <button 
                      onClick={() => handleRecover(id)}
                      className="bg-red-600 text-white px-4 py-1.5 rounded font-bold text-sm hover:bg-red-700"
                    >
                      שחזר
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
