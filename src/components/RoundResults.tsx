import { ArrowRight, Award, Ban, Check, RotateCcw, Trophy } from 'lucide-react';
import { ALPHABET, CATEGORIES } from '../game/dictionary';
import type {
  CategoryId,
  LanguageMode,
  LetterSelectionMode,
  RoundResult,
  StandingEntry,
} from '../game/types';
import { formatCategoryTitle } from './TitleEmblem';

interface RoundResultsProps {
  result: RoundResult;
  standings: StandingEntry[];
  totalRounds: number;
  language: LanguageMode;
  letterMode: LetterSelectionMode;
  nextManualLetter: string;
  onNextManualLetterChange: (letter: string) => void;
  canModerate: boolean;
  onToggleVeto: (playerId: string, categoryId: CategoryId) => void;
  onNextRound: () => void;
  onFinishGame: () => void;
  usedLetters: string[];
}

export function RoundResults({
  result,
  standings,
  totalRounds,
  language,
  letterMode,
  nextManualLetter,
  onNextManualLetterChange,
  canModerate,
  onToggleVeto,
  onNextRound,
  onFinishGame,
  usedLetters,
}: RoundResultsProps) {
  const isFinalRound = result.roundNumber >= totalRounds;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10 space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 font-display text-2xl font-extrabold text-white">
            {result.letter}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 tabular-nums">
              Round {result.roundNumber} of {totalRounds} Results
            </p>
            <h1 className="font-display text-2xl font-extrabold text-slate-900">
              Letter "{result.letter}" Scorecard
            </h1>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-600">
          10 pts unique · 5 pts shared · 0 pts blank or invalid
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3.5 font-semibold text-slate-700">Category</th>
              {result.playerScores.map((ps) => (
                <th key={ps.playerId} className="px-4 py-3.5 font-bold text-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{ps.playerName}</span>
                    <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                      {ps.roundTotal} pts
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CATEGORIES.map((cat) => {
              const { primary, secondary } = formatCategoryTitle(cat, language);
              return (
                <tr key={cat.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 align-top font-semibold text-slate-800">
                    <div>{primary}</div>
                    {secondary && (
                      <div className="text-xs font-normal text-slate-500">{secondary}</div>
                    )}
                  </td>

                  {result.playerScores.map((ps) => {
                    const cell = ps.cells[cat.id];
                    const canVeto =
                      canModerate &&
                      cell.raw.trim().length > 0 &&
                      cell.status !== 'wrong_letter';

                    return (
                      <td key={ps.playerId} className="px-4 py-3.5 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={`font-semibold break-words ${
                                cell.points === 0
                                  ? 'text-slate-400 line-through'
                                  : 'text-slate-900'
                              }`}
                            >
                              {cell.raw || '—'}
                            </p>
                            <p
                              className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${
                                cell.status === 'unique'
                                  ? 'text-emerald-700'
                                  : cell.status === 'shared'
                                    ? 'text-amber-700'
                                    : 'text-red-700'
                              }`}
                            >
                              {cell.status === 'unique' && (
                                <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                              )}
                              {cell.status === 'shared' && (
                                <Award className="h-3 w-3 shrink-0" aria-hidden="true" />
                              )}
                              {(cell.status === 'blank' ||
                                cell.status === 'wrong_letter' ||
                                cell.status === 'invalid') && (
                                <Ban className="h-3 w-3 shrink-0" aria-hidden="true" />
                              )}
                              <span>{cell.reason}</span>
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span
                              className={`font-mono text-xs font-bold tabular-nums ${
                                cell.points === 10
                                  ? 'text-emerald-700'
                                  : cell.points === 5
                                    ? 'text-amber-700'
                                    : 'text-slate-400'
                              }`}
                            >
                              +{cell.points}
                            </span>

                            {canVeto && (
                              <button
                                type="button"
                                onClick={() => onToggleVeto(ps.playerId, cat.id)}
                                className="text-[11px] font-semibold text-slate-500 underline hover:text-slate-800"
                              >
                                {cell.overriddenInvalid ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700">
                                    <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
                                    Accept
                                  </span>
                                ) : (
                                  'Veto'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Cumulative Leaderboard + Next Action */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
          <h2 className="text-sm font-bold text-slate-900">Cumulative Standings</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {standings.map((entry) => (
              <div
                key={entry.playerId}
                className="flex items-center justify-between gap-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 font-mono text-xs font-bold text-slate-500 tabular-nums">
                    #{entry.rank}
                  </span>
                  <span className="truncate font-semibold text-slate-900">
                    {entry.playerName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 tabular-nums">
                  <span>{entry.uniqueCount} unique</span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {entry.totalScore} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5 space-y-4">
          {!isFinalRound && canModerate && letterMode === 'manual' && (
            <div>
              <span className="block text-xs font-semibold text-slate-600">
                Pick Next Round Letter
              </span>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {ALPHABET.map((letter) => {
                  const used = usedLetters.includes(letter);
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => onNextManualLetterChange(letter)}
                      className={`h-7 rounded text-xs font-display font-bold transition-colors ${
                        nextManualLetter === letter
                          ? 'bg-emerald-700 text-white'
                          : used
                            ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {canModerate ? (
            isFinalRound ? (
              <button
                type="button"
                onClick={onFinishGame}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                <span>View Final Winner Podium</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={onNextRound}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
                >
                  <span>Start Round {result.roundNumber + 1}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onFinishGame}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  End Match Early & Show Podium
                </button>
              </div>
            )
          ) : (
            <p className="text-center text-sm font-medium text-slate-600">
              Waiting for the room host to start the next round...
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
