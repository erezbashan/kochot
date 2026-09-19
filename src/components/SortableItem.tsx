import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Player } from '@/lib/firestore';

export function SortableItem({ player, index, onRemove }: { player: Player, index: number, onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-sm mb-2 relative transition-all ${isDragging ? 'z-50 ring-2 ring-blue-400 scale-[1.02] shadow-md' : 'hover:border-blue-200'}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="text-slate-400 cursor-grab active:cursor-grabbing p-3 touch-none bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <GripVertical size={24} />
      </div>
      <span className="font-bold text-lg text-gray-400 w-6 text-center">{index + 1}.</span>
      <span className="flex-1 text-lg font-semibold text-gray-700">{player.name}</span>
      <button 
        onClick={() => onRemove(player.id)} 
        className="text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ml-2"
      >
        לא מכיר
      </button>
    </div>
  );
}
