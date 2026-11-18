import { useState } from 'react';
import { Copy, Check, Play, LogOut, Users } from 'lucide-react';
import { ALPHABET } from '../game/dictionary';
import type { LiveRoomState } from '../game/types';

interface LiveRoomLobbyProps {
  roomState: LiveRoomState;
  playerId: string;
  manualLetter: string;
  onManualLetterChange: (letter: string) => void;
  onStartRound: () => void;
  onLeaveRoom: () => void;
}

export function LiveRoomLobby({
  roomState,
  playerId,
  manualLetter,
  onManualLetterChange,
  onStartRound,
  onLeaveRoom,
}: LiveRoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const isHost = roomState.hostId === playerId;

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomState.roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Live Room Sync</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-900">
              Room {roomState.roomCode}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
              {roomState.totalRounds} rounds · {roomState.timerSeconds}s per round ·{' '}
              {roomState.letterMode === 'manual' ? 'Manual letter' : 'Random letter'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <span>Connected Players ({roomState.players.length})</span>
          </h2>
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {roomState.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="font-semibold text-slate-900">
                  {p.name}
                  {p.id === playerId && ' (You)'}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {p.id === roomState.hostId ? 'Host' : 'Player'}
                  {p.connected === false ? ' · Offline' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {isHost && roomState.letterMode === 'manual' && (
          <div>
            <span className="block text-xs font-semibold text-slate-600">
              Pick Starting Letter for Round 1
            </span>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => onManualLetterChange(letter)}
                  className={`h-8 rounded font-display text-xs font-bold transition-colors ${
                    manualLetter === letter
                      ? 'bg-emerald-700 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {isHost ? (
            <button
              type="button"
              data-start="true"
              onClick={onStartRound}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>Start Round 1</span>
            </button>
          ) : (
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-600">
              Waiting for host to start the round...
            </div>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Leave</span>
          </button>
        </div>
      </section>
    </main>
  );
}
