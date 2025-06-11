// src/components/ui/MenuContainer.tsx
import React from 'react';
import { X } from 'lucide-react';

interface MenuContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const MenuContainer = ({ title, onClose, children }: MenuContainerProps) => (
    <div className="bg-slate-900/90 backdrop-blur-sm border-2 border-purple-500/70 rounded-lg overflow-hidden shadow-2xl w-[480px] h-[480px] flex flex-col p-4 text-slate-200 animate-fade-in">
        <div className="flex justify-between items-center mb-4 border-b-2 border-purple-500/30 pb-2">
            <h2 className="text-2xl font-bold text-purple-400 tracking-wide">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors">
                <X size={24} />
            </button>
        </div>
        <div className="flex-grow overflow-y-auto pr-2 menu-scroll">
            {children}
        </div>
    </div>
);
