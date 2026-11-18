import { Medal, RotateCcw, Trophy, Home } from 'lucide-react';
import type { RoundResult, StandingEntry } from '../game/types';

interface PodiumScreenProps {
  standings: StandingEntry[];
  roundResults: RoundResult[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  canControl?: boolean;
}

export function PodiumScreen({
  standings,
  roundResults,
  onPlayAgain,
  onBackToMenu,
  canControl = true,
}: PodiumScreenProps) {
  const winners = standings.filter((s) => s.rank === 1);
  const winner = winners[0];
  const isTie = winners.length > 1;
  const topThree = standings.slice(0, 3);

  const headline = isTie
    ? `Tie for 1st: ${winners.map((w) => w.playerName).join(' & ')}`
    : winner
      ? `${winner.playerName} Wins!`
      : 'Final Standings';

  // Visual podium ordering: 2nd (left), 1st (center), 3rd (right) when >= 3 players
  const podiumSlots =
    topThree.length === 3
      ? [topThree[1], topThree[0], topThree[2]]
      : topThree;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12 space-y-8">
      {/* Winner Celebration Header */}
      <section className="animate-pop-in rounded-xl border border-slate-200 bg-white p-7 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Trophy className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          Match Complete · {roundResults.length}{' '}
          {roundResults.length === 1 ? 'Round' : 'Rounds'} Played
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-slate-900 sm:text-4xl text-balance">
          {headline}
        </h1>
        {winner && (
          <p className="mt-2 text-sm text-slate-600 tabular-nums">
            {winner.totalScore} total points · {winner.uniqueCount} unique words ·{' '}
            {winner.sharedCount} shared words
          </p>
        )}
      </section>

      {/* Podium Cards */}
      <section
        aria-label="Winner podium"
        className={`grid gap-4 items-end ${
          podiumSlots.length === 3
            ? 'sm:grid-cols-3'
            : podiumSlots.length === 2
              ? 'sm:grid-cols-2'
              : 'sm:grid-cols-1 max-w-sm mx-auto'
        }`}
      >
        {podiumSlots.map((entry) => {
          const isFirst = entry.rank === 1;
          const isSecond = entry.rank === 2;
          return (
            <div
              key={entry.playerId}
              className={`rounded-xl border bg-white p-5 text-center shadow-xs ${
                isFirst
                  ? 'border-amber-300 sm:pb-8 sm:pt-7 ring-2 ring-amber-400/25'
                  : 'border-slate-200'
              }`}
            >
              <div
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-bold ${
                  isFirst
                    ? 'bg-amber-100 text-amber-800'
                    : isSecond
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-orange-100 text-orange-800'
                }`}
              >
                <Medal className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-2 font-mono text-xs font-bold text-slate-500">
                Rank #{entry.rank}
              </p>
              <h2 className="mt-1 truncate font-display text-xl font-extrabold text-slate-900">
                {entry.playerName}
              </h2>
              <p className="mt-2 font-mono text-2xl font-extrabold text-emerald-700 tabular-nums">
                {entry.totalScore} <span className="text-xs font-semibold text-slate-500">pts</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {entry.uniqueCount} unique · {entry.sharedCount} shared
              </p>
            </div>
          );
        })}
      </section>

      {/* Round-by-Round Leaderboard */}
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-semibold text-slate-700">Rank</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Player</th>
              {roundResults.map((r) => (
                <th
                  key={r.roundNumber}
                  className="px-3 py-3 text-right font-mono text-xs font-semibold text-slate-600 tabular-nums"
                >
                  R{r.roundNumber} ({r.letter})
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-slate-900">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.map((entry) => (
              <tr key={entry.playerId}>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 tabular-nums">
                  #{entry.rank}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {entry.playerName}
                </td>
                {roundResults.map((r) => {
                  const ps = r.playerScores.find((p) => p.playerId === entry.playerId);
                  return (
                    <td
                      key={r.roundNumber}
                      className="px-3 py-3 text-right font-mono text-xs text-slate-600 tabular-nums"
                    >
                      {ps?.roundTotal ?? 0}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-700 tabular-nums">
                  {entry.totalScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {canControl && (
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Play Again</span>
          </button>
        )}
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>Main Menu</span>
        </button>
      </div>
    </main>
  );
}
