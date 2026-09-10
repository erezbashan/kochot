import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Player } from '@/lib/store';

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
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 p-4 md:p-5 bg-white border-2 border-gray-200 rounded-xl shadow-sm mb-3 relative transition-all ${isDragging ? 'z-50 ring-4 ring-purple-400 scale-105 shadow-xl' : 'hover:border-purple-300'}`}>
      <button {...attributes} {...listeners} className="text-gray-400 hover:text-purple-600 p-2 cursor-grab active:cursor-grabbing bg-gray-50 rounded-lg">
        <GripVertical size={28} />
      </button>
      <span className="font-black text-2xl text-purple-300 w-8 text-center">{index + 1}.</span>
      <span className="flex-1 text-xl md:text-2xl font-bold text-gray-800">{player.name}</span>
      <button 
        onClick={() => onRemove(player.id)} 
        className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 border-2 border-rose-100 px-4 py-2 rounded-lg text-base md:text-lg font-extrabold transition-colors shadow-sm"
      >
        לא מכיר
      </button>
    </div>
  );
}
