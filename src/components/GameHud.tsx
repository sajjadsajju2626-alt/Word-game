import { useEffect, useState } from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { ALPHABET } from '../game/dictionary';

interface GameHudProps {
  currentRound: number;
  totalRounds: number;
  targetLetter: string;
  timeLeft: number;
  timerSeconds: number;
  playerName?: string;
  muted: boolean;
  onToggleMute: () => void;
  onPause?: () => void;
  roomCode?: string;
}

export function GameHud({
  currentRound,
  totalRounds,
  targetLetter,
  timeLeft,
  timerSeconds,
  playerName,
  muted,
  onToggleMute,
  onPause,
  roomCode,
}: GameHudProps) {
  const [displayLetter, setDisplayLetter] = useState(targetLetter);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayLetter(targetLetter);
      return;
    }

    let step = 0;
    const totalSteps = 7;
    const timer = setInterval(() => {
      step += 1;
      if (step >= totalSteps) {
        setDisplayLetter(targetLetter);
        clearInterval(timer);
      } else {
        setDisplayLetter(ALPHABET[Math.floor(Math.random() * ALPHABET.length)]);
      }
    }, 55);

    return () => {
      clearInterval(timer);
      setDisplayLetter(targetLetter);
    };
  }, [targetLetter, currentRound]);

  const ratio = timerSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / timerSeconds)) : 0;
  const isUrgent = timeLeft <= 10;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Round + Player info */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            aria-label={`Target letter ${targetLetter}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-700 font-display text-2xl font-extrabold text-white"
          >
            {displayLetter}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="tabular-nums">
                Round {currentRound} of {totalRounds}
              </span>
              {roomCode && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-700">Room {roomCode}</span>
                </>
              )}
            </div>
            <p className="truncate text-sm font-bold text-slate-900">
              {playerName ? `${playerName}'s Sheet` : `Starting Letter: ${targetLetter}`}
            </p>
          </div>
        </div>

        {/* Countdown Clock */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-28 sm:w-36">
            <div className="flex items-baseline justify-between text-xs font-semibold">
              <span className={isUrgent ? 'text-red-700' : 'text-slate-500'}>
                {isUrgent ? 'Hurry' : 'Time'}
              </span>
              <span
                data-testid="countdown-timer"
                className={`font-mono text-base font-bold tabular-nums ${
                  isUrgent ? 'text-red-700' : 'text-slate-900'
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-[width] duration-300 ${
                  isUrgent ? 'bg-red-600' : 'bg-emerald-600'
                }`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {onPause && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause game"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
