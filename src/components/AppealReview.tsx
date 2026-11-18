import { ArrowRight, Award, Ban, Check, Gavel, RotateCcw } from 'lucide-react';
import { CATEGORIES } from '../game/dictionary';
import type {
  AppealDecision,
  CategoryId,
  LanguageMode,
  RoundResult,
} from '../game/types';
import { formatCategoryTitle } from './TitleEmblem';

interface AppealReviewProps {
  result: RoundResult;
  totalRounds: number;
  language: LanguageMode;
  canAppeal: boolean;
  canConfirm: boolean;
  onSetAppeal: (playerId: string, categoryId: CategoryId, decision: AppealDecision) => void;
  onConfirmAppeals: () => void;
}

export function AppealReview({
  result,
  totalRounds,
  language,
  canAppeal,
  canConfirm,
  onSetAppeal,
  onConfirmAppeals,
}: AppealReviewProps) {
  const appealCount = result.playerScores.reduce((acc, ps) => {
    return (
      acc +
      CATEGORIES.filter((cat) => ps.cells[cat.id].appealDecision !== 'auto').length
    );
  }, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10 space-y-7">
      {/* Header */}
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-600 font-display text-2xl font-extrabold text-white">
            {result.letter}
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700">
              അപ്പീൽ സിസ്റ്റം · Round {result.roundNumber} of {totalRounds}
            </p>
            <h1 className="font-display text-2xl font-extrabold text-slate-900">
              Appeal & Review Answers
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Inspect every player's words for letter "{result.letter}". Approve or mark incorrect before locking scores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
          <Gavel className="h-4 w-4 text-amber-700" aria-hidden="true" />
          <span className="tabular-nums">
            {appealCount} {appealCount === 1 ? 'appeal' : 'appeals'} applied
          </span>
        </div>
      </section>

      {/* Live Appeal Inspection Matrix */}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
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
                <tr key={cat.id} className="hover:bg-slate-50/40">
                  <td className="px-4 py-4 align-top font-semibold text-slate-800">
                    <div>{primary}</div>
                    {secondary && (
                      <div className="text-xs font-normal text-slate-500">{secondary}</div>
                    )}
                  </td>

                  {result.playerScores.map((ps) => {
                    const cell = ps.cells[cat.id];
                    const hasWord = cell.raw.trim().length > 0;
                    const isEffectiveValid = cell.points > 0;
                    const isOverridden = cell.appealDecision !== 'auto';

                    return (
                      <td key={ps.playerId} className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className={`font-semibold break-words ${
                                  !isEffectiveValid
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

                            <span
                              className={`font-mono text-xs font-bold tabular-nums shrink-0 ${
                                cell.points === 10
                                  ? 'text-emerald-700'
                                  : cell.points === 5
                                    ? 'text-amber-700'
                                    : 'text-slate-400'
                              }`}
                            >
                              +{cell.points}
                            </span>
                          </div>

                          {canAppeal && hasWord && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <div
                                className="inline-flex rounded-md bg-slate-100 p-0.5"
                                role="group"
                                aria-label={`Appeal decision for ${ps.playerName}'s ${cat.en}: ${cell.raw}`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSetAppeal(ps.playerId, cat.id, 'approved')
                                  }
                                  aria-pressed={isEffectiveValid}
                                  className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                                    isEffectiveValid
                                      ? 'bg-white text-emerald-800 shadow-xs'
                                      : 'text-slate-600 hover:text-emerald-800'
                                  }`}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSetAppeal(ps.playerId, cat.id, 'rejected')
                                  }
                                  aria-pressed={!isEffectiveValid}
                                  className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                                    !isEffectiveValid
                                      ? 'bg-white text-red-700 shadow-xs'
                                      : 'text-slate-600 hover:text-red-700'
                                  }`}
                                >
                                  Mark Incorrect
                                </button>
                              </div>

                              {isOverridden && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSetAppeal(ps.playerId, cat.id, 'auto')
                                  }
                                  aria-label={`Reset ${ps.playerName}'s ${cat.en} appeal`}
                                  className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                                >
                                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                                  <span>Reset</span>
                                </button>
                              )}
                            </div>
                          )}
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

      {/* Bottom Rule Reminder & Confirm CTA */}
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-600 space-y-0.5">
          <p className="font-semibold text-slate-800">
            Live Scoring Rules (Updated Automatically)
          </p>
          <p>
            10 pts unique valid word · 5 pts duplicate valid word · 0 pts blank, invalid, or wrong letter
          </p>
        </div>

        {canConfirm ? (
          <button
            type="button"
            onClick={onConfirmAppeals}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Confirm Scores & Continue</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <p className="text-sm font-medium text-slate-600">
            Waiting for host to confirm final scores...
          </p>
        )}
      </section>
    </main>
  );
}
