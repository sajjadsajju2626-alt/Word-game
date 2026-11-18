import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestartRound: () => void;
  onExitToMenu: () => void;
}

export function PauseModal({
  onResume,
  onRestartRound,
  onExitToMenu,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
    >
      <div className="animate-pop-in w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg space-y-5">
        <div>
          <h2 id="pause-modal-title" className="font-display text-xl font-extrabold text-slate-900">
            Game Paused
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Countdown timer is frozen while paused.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>Resume Game</span>
          </button>
          <button
            type="button"
            onClick={onRestartRound}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Restart Round</span>
          </button>
          <button
            type="button"
            onClick={onExitToMenu}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Exit to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
