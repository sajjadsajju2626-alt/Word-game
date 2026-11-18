import { Eye, ShieldCheck } from 'lucide-react';

interface HandoffScreenProps {
  playerName: string;
  playerIndex: number;
  totalPlayers: number;
  currentRound: number;
  totalRounds: number;
  targetLetter: string;
  onReveal: () => void;
}

export function HandoffScreen({
  playerName,
  playerIndex,
  totalPlayers,
  currentRound,
  totalRounds,
  targetLetter,
  onReveal,
}: HandoffScreenProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-10">
      <section className="animate-pop-in w-full rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="mt-4 text-xs font-semibold text-slate-500 tabular-nums">
          Round {currentRound} of {totalRounds} · Turn {playerIndex + 1} of {totalPlayers}
        </p>

        <h1 className="mt-2 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Pass device to {playerName}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Previous answers are hidden. When {playerName} is ready, reveal the sheet for letter{' '}
          <span className="font-display font-extrabold text-emerald-800">{targetLetter}</span>.
        </p>

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-700 font-display text-3xl font-extrabold text-white">
          {targetLetter}
        </div>

        <button
          type="button"
          onClick={onReveal}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span>Reveal {playerName}'s Sheet</span>
        </button>
      </section>
    </main>
  );
}
