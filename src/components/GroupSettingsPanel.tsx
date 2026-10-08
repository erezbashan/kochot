import React, { useState } from 'react';
import { Group, updateGroupSettings, addPlayerToGroupWithId, Player, Ranking } from '@/lib/firestore';
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

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-slate-100" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">הגדרות קבוצה (למנהלים בלבד)</h2>
      
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
          </p>
          <div className="space-y-4">
            {Array.from(missingIds).map(id => (
              <div key={id} className="flex gap-2 items-center bg-white p-3 rounded-lg border border-red-200">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
