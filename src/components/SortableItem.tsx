import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm mb-2 relative ${isDragging ? 'z-50 ring-2 ring-blue-400' : ''}`}>
      <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-700 p-1 cursor-grab active:cursor-grabbing">
        <GripVertical size={20} />
      </button>
      <span className="font-bold text-gray-400 w-6 text-center">{index + 1}.</span>
      <span className="flex-1 text-base font-medium">{player.name}</span>
      <button 
        onClick={() => onRemove(player.id)} 
        className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm font-semibold transition-colors"
      >
        לא מכיר
      </button>
    </div>
  );
}
