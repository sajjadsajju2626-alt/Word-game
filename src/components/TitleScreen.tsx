import { Plus, Trash2, Users, Bot, Radio, Shuffle, Grid, Play } from 'lucide-react';
import { ALPHABET } from '../game/dictionary';
import type {
  BotDifficulty,
  GameMode,
  LanguageMode,
  LetterSelectionMode,
  Player,
} from '../game/types';
import { TitleEmblem } from './TitleEmblem';

interface TitleScreenProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  language: LanguageMode;
  onLanguageChange: (lang: LanguageMode) => void;
  totalRounds: number;
  onTotalRoundsChange: (rounds: number) => void;
  timerSeconds: number;
  onTimerSecondsChange: (sec: number) => void;
  letterMode: LetterSelectionMode;
  onLetterModeChange: (mode: LetterSelectionMode) => void;
  manualLetter: string;
  onManualLetterChange: (letter: string) => void;
  soloPlayerName: string;
  onSoloPlayerNameChange: (name: string) => void;
  botDifficulty: BotDifficulty;
  onBotDifficultyChange: (diff: BotDifficulty) => void;
  botCount: number;
  onBotCountChange: (count: number) => void;
  localPlayers: Player[];
  onLocalPlayerNameChange: (id: string, name: string) => void;
  onAddLocalPlayer: () => void;
  onRemoveLocalPlayer: (id: string) => void;
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  liveName: string;
  onLiveNameChange: (name: string) => void;
  liveError: string | null;
  onStartLocalGame: () => void;
  onCreateLiveRoom: () => void;
  onJoinLiveRoom: () => void;
}

export function TitleScreen({
  mode,
  onModeChange,
  language,
  onLanguageChange,
  totalRounds,
  onTotalRoundsChange,
  timerSeconds,
  onTimerSecondsChange,
  letterMode,
  onLetterModeChange,
  manualLetter,
  onManualLetterChange,
  soloPlayerName,
  onSoloPlayerNameChange,
  botDifficulty,
  onBotDifficultyChange,
  botCount,
  onBotCountChange,
  localPlayers,
  onLocalPlayerNameChange,
  onAddLocalPlayer,
  onRemoveLocalPlayer,
  joinCode,
  onJoinCodeChange,
  liveName,
  onLiveNameChange,
  liveError,
  onStartLocalGame,
  onCreateLiveRoom,
  onJoinLiveRoom,
}: TitleScreenProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-4 py-6 sm:px-8 sm:py-10">
      <div className="space-y-8">
        {/* Header / Title Lockup */}
        <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <TitleEmblem />
            <div>
              <p className="text-xs font-semibold tracking-wide text-emerald-700">
                പേര് · സ്ഥലം · മൃഗം · പൂവ് · സാധനം
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl text-balance">
                Name, Place, Animal, Thing
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                10 pts unique word · 5 pts shared word · 0 pts blank or wrong letter
              </p>
            </div>
          </div>

          {/* Language Toggle */}
          <div
            className="inline-flex self-start rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="Display language"
          >
            {(
              [
                { id: 'bilingual', label: 'ML + EN' },
                { id: 'english', label: 'English' },
                { id: 'malayalam', label: 'മലയാളം' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onLanguageChange(opt.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                  language === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Main 2-column Game Setup Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Column: Mode + Players */}
          <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
            <div>
              <h2 className="text-sm font-bold text-slate-900">1. Choose Game Mode</h2>
              <div
                className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
                role="tablist"
                aria-label="Game mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'solo'}
                  onClick={() => onModeChange('solo')}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                    mode === 'solo'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bot className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Solo vs Bot</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'pass_and_play'}
                  onClick={() => onModeChange('pass_and_play')}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                    mode === 'pass_and_play'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Pass & Play</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'live_room'}
                  onClick={() => onModeChange('live_room')}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                    mode === 'live_room'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Live Room</span>
                </button>
              </div>
            </div>

            {mode === 'solo' && (
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div>
                  <label
                    htmlFor="solo-name"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Your Name
                  </label>
                  <input
                    id="solo-name"
                    type="text"
                    maxLength={24}
                    value={soloPlayerName}
                    onChange={(e) => onSoloPlayerNameChange(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-semibold text-slate-800">
                      Bot Opponents
                    </span>
                    <div className="mt-1.5 flex gap-1.5 rounded-lg bg-slate-100 p-1">
                      {[1, 2, 3].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => onBotCountChange(count)}
                          className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                            botCount === count
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {count} {count === 1 ? 'Bot' : 'Bots'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-semibold text-slate-800">
                      Bot Skill
                    </span>
                    <div className="mt-1.5 flex gap-1.5 rounded-lg bg-slate-100 p-1">
                      {(
                        [
                          { id: 'casual', label: 'Casual' },
                          { id: 'sharp', label: 'Sharp' },
                        ] as const
                      ).map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => onBotDifficultyChange(lvl.id)}
                          className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                            botDifficulty === lvl.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === 'pass_and_play' && (
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    Players ({localPlayers.length}/6)
                  </span>
                  <button
                    type="button"
                    onClick={onAddLocalPlayer}
                    disabled={localPlayers.length >= 6}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add Player
                  </button>
                </div>

                <div className="space-y-2">
                  {localPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-2">
                      <label htmlFor={`player-${player.id}`} className="sr-only">
                        Player {index + 1} name
                      </label>
                      <span className="w-6 text-xs font-mono font-semibold text-slate-400 tabular-nums">
                        {index + 1}.
                      </span>
                      <input
                        id={`player-${player.id}`}
                        type="text"
                        maxLength={24}
                        value={player.name}
                        onChange={(e) => onLocalPlayerNameChange(player.id, e.target.value)}
                        placeholder={`Player ${index + 1}`}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                      {localPlayers.length > 2 && (
                        <button
                          type="button"
                          onClick={() => onRemoveLocalPlayer(player.id)}
                          aria-label={`Remove ${player.name || `Player ${index + 1}`}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  A privacy curtain appears between turns so players cannot peek at earlier answers.
                </p>
              </div>
            )}

            {mode === 'live_room' && (
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div>
                  <label
                    htmlFor="live-player-name"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Your Display Name
                  </label>
                  <input
                    id="live-player-name"
                    type="text"
                    maxLength={24}
                    value={liveName}
                    onChange={(e) => onLiveNameChange(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                {liveError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                  >
                    {liveError}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onCreateLiveRoom}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Radio className="h-4 w-4" aria-hidden="true" />
                    Create Live Room
                  </button>

                  <div className="flex gap-2">
                    <label htmlFor="join-room-code" className="sr-only">
                      Room code
                    </label>
                    <input
                      id="join-room-code"
                      type="text"
                      maxLength={6}
                      value={joinCode}
                      onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
                      placeholder="CODE"
                      className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center font-mono text-sm font-bold uppercase tracking-widest text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                    <button
                      type="button"
                      onClick={onJoinLiveRoom}
                      disabled={!joinCode.trim()}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
                    >
                      Join
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Play together across separate browser tabs or devices using real-time WebSocket sync.
                </p>
              </div>
            )}
          </section>

          {/* Right Column: Rules, Letter & Timer */}
          <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-5">
            <h2 className="text-sm font-bold text-slate-900">2. Round & Letter Rules</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-slate-600">Rounds</span>
                <div className="mt-1.5 flex gap-1 rounded-lg bg-slate-100 p-1">
                  {[1, 3, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onTotalRoundsChange(r)}
                      className={`flex-1 rounded-md py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                        totalRounds === r
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-600">Timer</span>
                <div className="mt-1.5 flex gap-1 rounded-lg bg-slate-100 p-1">
                  {[30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onTimerSecondsChange(sec)}
                      className={`flex-1 rounded-md py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors ${
                        timerSeconds === sec
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Letter Selection */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <span className="block text-xs font-semibold text-slate-600">
                Starting Letter
              </span>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => onLetterModeChange('random')}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    letterMode === 'random'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  Random Spin
                </button>
                <button
                  type="button"
                  onClick={() => onLetterModeChange('manual')}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    letterMode === 'manual'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" aria-hidden="true" />
                  Pick A–Z
                </button>
              </div>

              {letterMode === 'manual' && (
                <div
                  className="grid grid-cols-7 gap-1 pt-1"
                  role="group"
                  aria-label="Pick starting letter"
                >
                  {ALPHABET.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => onManualLetterChange(letter)}
                      aria-pressed={manualLetter === letter}
                      className={`h-8 rounded-md font-display text-xs font-bold transition-colors ${
                        manualLetter === letter
                          ? 'bg-emerald-700 text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {mode !== 'live_room' && (
              <button
                type="button"
                data-start="true"
                onClick={onStartLocalGame}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Start Game</span>
              </button>
            )}
          </section>
        </div>
      </div>

      {/* Flat borderless bottom control hint */}
      <p className="mt-8 pt-2 text-center text-xs text-slate-500">
        Enter to jump between categories · Esc to pause · Works with English or Malayalam input
      </p>
    </main>
  );
}
