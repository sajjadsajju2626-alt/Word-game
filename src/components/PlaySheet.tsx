import { useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Lightbulb, Send } from 'lucide-react';
import { CATEGORIES } from '../game/dictionary';
import { getSuggestionsForCategory, validateWordForLetter } from '../game/rules';
import type { CategoryId, LanguageMode, RoundAnswers } from '../game/types';
import { formatCategoryTitle } from './TitleEmblem';

interface PlaySheetProps {
  targetLetter: string;
  language: LanguageMode;
  answers: RoundAnswers;
  onChangeAnswer: (category: CategoryId, value: string) => void;
  onSubmit: () => void;
  alreadySubmitted?: boolean;
  submittedCount?: number;
  totalPlayers?: number;
}

export function PlaySheet({
  targetLetter,
  language,
  answers,
  onChangeAnswer,
  onSubmit,
  alreadySubmitted = false,
  submittedCount = 0,
  totalPlayers = 1,
}: PlaySheetProps) {
  const [hintsEnabled, setHintsEnabled] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const filledValidCount = CATEGORIES.filter((cat) => {
    const res = validateWordForLetter(answers[cat.id], targetLetter, cat.id);
    return res.valid;
  }).length;

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index < CATEGORIES.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (!alreadySubmitted) {
        onSubmit();
      }
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Compact Letter Banner + Hints Toggle */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">
            Write a word starting with{' '}
            <span className="font-display text-base font-extrabold text-emerald-800">
              {targetLetter}
            </span>{' '}
            for each category ·{' '}
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-700">
              {filledValidCount}/5 ready
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHintsEnabled((v) => !v)}
          aria-pressed={hintsEnabled}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            hintsEnabled
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{hintsEnabled ? 'Word Hints: On' : 'Word Hints: Off'}</span>
        </button>
      </div>

      {/* Answer Sheet */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!alreadySubmitted) onSubmit();
        }}
        className="notebook-paper rounded-xl border border-slate-200 p-5 shadow-xs sm:p-7 space-y-5"
      >
        {CATEGORIES.map((cat, idx) => {
          const val = answers[cat.id];
          const validation = validateWordForLetter(val, targetLetter, cat.id);
          const { primary, secondary } = formatCategoryTitle(cat, language);
          const suggestions = hintsEnabled
            ? getSuggestionsForCategory(targetLetter, cat.id, val, 4)
            : [];

          const showError = val.trim().length > 0 && !validation.valid;
          const showValid = val.trim().length > 0 && validation.valid;

          return (
            <div
              key={cat.id}
              className="border-b border-slate-200/80 pb-5 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label
                  htmlFor={`cat-input-${cat.id}`}
                  className="flex items-baseline gap-2 text-base font-bold text-slate-900"
                >
                  <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{primary}</span>
                  {secondary && (
                    <span className="text-sm font-medium text-slate-500">
                      {secondary}
                    </span>
                  )}
                </label>

                {/* Non-hue-only live validation indicator */}
                {showValid && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{validation.message}</span>
                  </span>
                )}
                {showError && (
                  <span
                    role="status"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-700"
                  >
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{validation.message}</span>
                  </span>
                )}
              </div>

              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                id={`cat-input-${cat.id}`}
                type="text"
                autoFocus={idx === 0}
                disabled={alreadySubmitted}
                autoComplete="off"
                value={val}
                onChange={(e) => onChangeAnswer(cat.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                placeholder={
                  language === 'malayalam' ? cat.placeholderMl : cat.placeholderEn
                }
                className={`mt-2 w-full rounded-lg border px-3.5 py-2.5 text-base font-medium text-slate-900 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500 ${
                  showError
                    ? 'border-red-400 bg-red-50/40 focus:border-red-600 focus:ring-red-600/15'
                    : showValid
                      ? 'border-emerald-400 bg-emerald-50/20 focus:border-emerald-600 focus:ring-emerald-600/20'
                      : 'border-slate-300 bg-white focus:border-emerald-600 focus:ring-emerald-600/20'
                }`}
              />

              {hintsEnabled && !alreadySubmitted && suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400">Try:</span>
                  {suggestions.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => onChangeAnswer(cat.id, word)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-2">
          {alreadySubmitted ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900">
              Sheet submitted · Waiting for other players ({submittedCount}/{totalPlayers})
            </div>
          ) : (
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Submit Sheet</span>
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
