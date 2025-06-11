// src/components/ui/DialogueBox.tsx
// src/components/ui/DialogueBox.tsx
import type { DialogueState } from '../../types/game';
import { Button } from './Button';

interface DialogueBoxProps {
  dialogue: DialogueState;
}

export const DialogueBox = ({ dialogue }: DialogueBoxProps) => (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-purple-600 rounded-xl shadow-2xl shadow-purple-500/20 w-full max-w-lg text-white p-6 animate-fade-in">
        <h2 className="text-xl font-bold text-purple-400 mb-4 shadow-sm">{dialogue.title}</h2>
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-4"></div>
        <p className="text-slate-300 mb-6 whitespace-pre-wrap">{dialogue.text}</p>
        <div className="flex flex-col gap-3">
            {dialogue.options.map((option, index) => (
                <Button key={index} onClick={option.action} disabled={option.disabled}>
                    {option.text}
                </Button>
            ))}
        </div>
    </div>
);
