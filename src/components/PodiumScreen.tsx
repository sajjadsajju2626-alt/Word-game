import { useEffect, useRef } from 'react';
import { Medal, RotateCcw, Trophy, Home, History } from 'lucide-react';
import { CATEGORIES } from '../game/dictionary';
import type { RoundResult, StandingEntry } from '../game/types';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  maxVy: number;
  w: number;
  h: number;
  shape: 'rect' | 'circle' | 'ribbon' | 'diamond';
  color: string;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  alpha: number;
  life: number;
  maxLife: number;
}

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
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const winners = standings.filter((s) => s.rank === 1);
  const winner = winners[0];
  const isTie = winners.length > 1;
  const topThree = standings.slice(0, 3);
  const winnerKey = winners.map((w) => `${w.playerId}:${w.totalScore}`).join('|');

  useEffect(() => {
    if (!winnerKey) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#047857',
      '#10b981',
      '#34d399',
      '#f59e0b',
      '#fbbf24',
      '#f43f5e',
      '#ec4899',
      '#0ea5e9',
      '#6366f1',
      '#a855f7',
    ];
    const shapes: ConfettiParticle['shape'][] = ['rect', 'circle', 'ribbon', 'diamond'];
    const particles: ConfettiParticle[] = [];

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId: number | null = null;
    let waveTimers: number[] = [];

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const pushParticle = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      options: { gravityBase?: number; lifeBase?: number } = {},
    ) => {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      particles.push({
        x,
        y,
        vx,
        vy,
        gravity: (options.gravityBase ?? 0.15) + Math.random() * 0.1,
        drag: 0.986 + Math.random() * 0.008,
        maxVy: 4.2 + Math.random() * 2.6,
        w: shape === 'ribbon' ? 4.5 + Math.random() * 3.5 : 6.5 + Math.random() * 5.5,
        h: shape === 'ribbon' ? 14 + Math.random() * 8 : 6.5 + Math.random() * 5.5,
        shape,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.26,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: 0.09 + Math.random() * 0.16,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.09,
        wobbleAmp: 0.7 + Math.random() * 0.95,
        alpha: 1,
        life: 0,
        maxLife: (options.lifeBase ?? 320) + Math.random() * 180,
      });
    };

    const spawnBurst = (
      originX: number,
      originY: number,
      count: number,
      spreadMin: number,
      spreadMax: number,
      speedMin: number,
      speedMax: number,
      options?: { gravityBase?: number; lifeBase?: number },
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = spreadMin + Math.random() * (spreadMax - spreadMin);
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        pushParticle(
          originX + (Math.random() - 0.5) * 34,
          originY + (Math.random() - 0.5) * 22,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          options,
        );
      }
    };

    const spawnTopShower = (
      count: number,
      options?: { gravityBase?: number; lifeBase?: number },
    ) => {
      for (let i = 0; i < count; i++) {
        const x = width * (0.04 + Math.random() * 0.92);
        const y = -12 - Math.random() * 70;
        const vx = (Math.random() - 0.5) * 3.4;
        const vy = 1.6 + Math.random() * 4.2;
        pushParticle(x, y, vx, vy, { gravityBase: 0.11, lifeBase: 360, ...options });
      }
    };

    const scheduleWave = (delayMs: number, fn: () => void) => {
      const timerId = window.setTimeout(() => {
        waveTimers = waveTimers.filter((id) => id !== timerId);
        fn();
      }, delayMs);
      waveTimers.push(timerId);
    };

    // Wave 1 (0ms): high-energy side cannons + full-width top shower
    spawnBurst(width * 0.08, height * 0.76, 85, -Math.PI * 0.45, -Math.PI * 0.12, 12, 22);
    spawnBurst(width * 0.92, height * 0.76, 85, -Math.PI * 0.88, -Math.PI * 0.55, 12, 22);
    spawnTopShower(90);

    // Wave 2 (550ms): dual upper-corner celebration bursts
    scheduleWave(550, () => {
      spawnBurst(width * 0.24, height * 0.24, 55, -Math.PI * 0.85, -Math.PI * 0.15, 6, 13);
      spawnBurst(width * 0.76, height * 0.24, 55, -Math.PI * 0.85, -Math.PI * 0.15, 6, 13);
    });

    // Wave 3 (1350ms): center starburst + mid-celebration top shower
    scheduleWave(1350, () => {
      spawnBurst(width * 0.5, height * 0.3, 70, -Math.PI * 0.92, -Math.PI * 0.08, 7, 15);
      spawnTopShower(55);
    });

    // Wave 4 (2400ms): side cannon encore
    scheduleWave(2400, () => {
      spawnBurst(width * 0.1, height * 0.68, 55, -Math.PI * 0.44, -Math.PI * 0.14, 11, 20);
      spawnBurst(width * 0.9, height * 0.68, 55, -Math.PI * 0.86, -Math.PI * 0.56, 11, 20);
    });

    // Wave 5 (3600ms): lingering festive flutter rain
    scheduleWave(3600, () => {
      spawnTopShower(65, { gravityBase: 0.09, lifeBase: 380 });
    });

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.667, 2.2);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        p.vx *= Math.pow(p.drag, dt);
        p.vy = Math.min(p.vy * Math.pow(p.drag, dt) + p.gravity * dt, p.maxVy);
        p.wobblePhase += p.wobbleSpeed * dt;
        p.x += (p.vx + Math.sin(p.wobblePhase) * p.wobbleAmp) * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.tilt += p.tiltSpeed * dt;

        const fadeStart = p.maxLife * 0.78;
        if (p.life > fadeStart) {
          p.alpha = Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart));
        }

        if (p.life >= p.maxLife || p.y > height + 48) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, Math.max(0.18, Math.abs(Math.cos(p.tilt))));
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -p.h * 0.6);
          ctx.lineTo(p.w * 0.55, 0);
          ctx.lineTo(0, p.h * 0.6);
          ctx.lineTo(-p.w * 0.55, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      if (particles.length > 0 || waveTimers.length > 0) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      waveTimers.forEach((id) => window.clearTimeout(id));
      waveTimers = [];
      window.removeEventListener('resize', resizeCanvas);
      ctx.clearRect(0, 0, width, height);
    };
  }, [winnerKey]);

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

  const roundHistory = roundResults.map((r) => {
    const sortedPlayers = [...r.playerScores]
      .map((ps) => {
        let uniqueCount = 0;
        let sharedCount = 0;
        for (const cat of CATEGORIES) {
          const cell = ps.cells[cat.id];
          if (!cell) continue;
          if (cell.status === 'unique') uniqueCount += 1;
          else if (cell.status === 'shared') sharedCount += 1;
        }
        return { ...ps, uniqueCount, sharedCount };
      })
      .sort(
        (a, b) =>
          b.roundTotal - a.roundTotal ||
          b.uniqueCount - a.uniqueCount ||
          a.playerName.localeCompare(b.playerName),
      );

    const challenged: Array<{
      playerName: string;
      categoryLabel: string;
      word: string;
      decision: 'auto' | 'approved' | 'rejected';
      overriddenInvalid: boolean;
      points: 0 | 5 | 10;
      reason: string;
    }> = [];

    for (const ps of r.playerScores) {
      for (const cat of CATEGORIES) {
        const cell = ps.cells[cat.id];
        if (!cell || !cell.raw.trim()) continue;
        const isChallenged =
          cell.appealDecision !== 'auto' ||
          Boolean(cell.overriddenInvalid) ||
          Boolean(cell.appealedBy);
        if (isChallenged) {
          challenged.push({
            playerName: ps.playerName,
            categoryLabel: `${cat.ml} (${cat.en})`,
            word: cell.raw,
            decision: cell.appealDecision,
            overriddenInvalid: Boolean(cell.overriddenInvalid),
            points: cell.points,
            reason: cell.reason,
          });
        }
      }
    }

    return {
      roundNumber: r.roundNumber,
      letter: r.letter,
      sortedPlayers,
      challenged,
    };
  });

  const totalChallenged = roundHistory.reduce((sum, item) => sum + item.challenged.length, 0);

  return (
    <>
      <canvas
        ref={confettiCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 h-full w-full"
      />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 space-y-8 min-w-0">
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
          </div>

          {/* Game History Sidebar */}
          <aside
            aria-label="Game History"
            className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5 lg:sticky lg:top-6"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="inline-flex items-center gap-2 font-display text-base font-extrabold text-slate-900">
                  <History className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  <span>Game History</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                  {roundResults.length} {roundResults.length === 1 ? 'round' : 'rounds'} ·{' '}
                  {totalChallenged} {totalChallenged === 1 ? 'word' : 'words'} challenged
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Chosen Letters
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roundHistory.map((item) => (
                  <span
                    key={item.roundNumber}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800"
                  >
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      R{item.roundNumber}
                    </span>
                    <span className="font-display font-extrabold text-emerald-800">
                      {item.letter}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {roundHistory.map((item) => (
                <section
                  key={item.roundNumber}
                  className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md bg-emerald-700 px-2 py-0.5 font-display text-xs font-extrabold text-white whitespace-nowrap">
                        {item.letter}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">
                        Round {item.roundNumber}
                      </h3>
                    </div>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        item.challenged.length > 0
                          ? 'font-semibold text-amber-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.challenged.length > 0
                        ? `${item.challenged.length} challenged`
                        : 'No challenges'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {item.sortedPlayers.map((ps) => {
                      const pct = Math.max(0, Math.min(100, Math.round((ps.roundTotal / 50) * 100)));
                      return (
                        <div key={ps.playerId} className="space-y-1">
                          <div className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="truncate font-semibold text-slate-800">
                              {ps.playerName}
                            </span>
                            <span className="shrink-0 font-mono text-slate-600 tabular-nums">
                              <span className="text-[11px] text-slate-400 mr-1.5">
                                {ps.uniqueCount}U · {ps.sharedCount}S
                              </span>
                              <span className="font-bold text-slate-900">{ps.roundTotal} pts</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {item.challenged.length > 0 && (
                    <div className="border-t border-slate-200/80 pt-2.5 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Challenged Words
                      </p>
                      <ul className="space-y-1.5">
                        {item.challenged.map((ch, idx) => {
                          const isRejected = ch.decision === 'rejected' || ch.overriddenInvalid;
                          const isApproved = ch.decision === 'approved';
                          const statusColor = isRejected
                            ? 'text-red-700'
                            : isApproved
                              ? 'text-emerald-700'
                              : 'text-amber-700';
                          const statusLabel = isRejected
                            ? 'Disapproved · +0'
                            : isApproved
                              ? `Approved · +${ch.points}`
                              : `Challenged · +${ch.points}`;
                          return (
                            <li
                              key={`${ch.playerName}-${ch.categoryLabel}-${idx}`}
                              className="rounded-md border border-slate-200/80 bg-white px-2.5 py-2 text-xs"
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <span
                                  className={`font-semibold break-words ${
                                    isRejected ? 'text-slate-400 line-through' : 'text-slate-900'
                                  }`}
                                >
                                  {ch.word}
                                </span>
                                <span
                                  className={`shrink-0 font-mono text-[11px] font-semibold tabular-nums ${statusColor}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {ch.playerName} · {ch.categoryLabel}
                              </p>
                              <p className={`mt-0.5 text-[11px] ${statusColor}`}>{ch.reason}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {totalChallenged === 0 && (
              <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                No words were challenged during this match.
              </p>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
