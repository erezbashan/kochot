import React from 'react';
import { Group, updateGroupSettings } from '@/lib/firestore';

export default function GroupSettingsPanel({ group }: { group: Group }) {
  const toggleSetting = async (key: keyof typeof group.settings) => {
    const newValue = !group.settings[key];
    await updateGroupSettings(group.id, { [key]: newValue });
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-slate-100" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">הגדרות קבוצה (למנהלים בלבד)</h2>
      
      <div className="space-y-4">
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
    </div>
  );
}
