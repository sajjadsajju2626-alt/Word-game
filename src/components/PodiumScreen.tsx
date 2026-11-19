import { useEffect, useRef } from 'react';
import { Medal, RotateCcw, Trophy, Home } from 'lucide-react';
import type { RoundResult, StandingEntry } from '../game/types';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  w: number;
  h: number;
  shape: 'rect' | 'circle' | 'ribbon';
  color: string;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
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

    const colors = ['#047857', '#10b981', '#f59e0b', '#fbbf24', '#f43f5e', '#0ea5e9', '#6366f1'];
    const shapes: ConfettiParticle['shape'][] = ['rect', 'circle', 'ribbon'];
    const particles: ConfettiParticle[] = [];

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId: number | null = null;
    let secondWaveTimer: number | null = null;

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

    const spawnBurst = (
      originX: number,
      originY: number,
      count: number,
      spreadMin: number,
      spreadMax: number,
      speedMin: number,
      speedMax: number,
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = spreadMin + Math.random() * (spreadMax - spreadMin);
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        particles.push({
          x: originX + (Math.random() - 0.5) * 28,
          y: originY + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.22 + Math.random() * 0.14,
          drag: 0.985 + Math.random() * 0.008,
          w: shape === 'ribbon' ? 4 + Math.random() * 3 : 6 + Math.random() * 5,
          h: shape === 'ribbon' ? 13 + Math.random() * 6 : 6 + Math.random() * 5,
          shape,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.22,
          tilt: Math.random() * Math.PI * 2,
          tiltSpeed: 0.08 + Math.random() * 0.14,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05 + Math.random() * 0.08,
          alpha: 1,
          life: 0,
          maxLife: 190 + Math.random() * 110,
        });
      }
    };

    spawnBurst(width * 0.12, height * 0.72, 48, -Math.PI * 0.44, -Math.PI * 0.14, 10, 19);
    spawnBurst(width * 0.88, height * 0.72, 48, -Math.PI * 0.86, -Math.PI * 0.56, 10, 19);
    spawnBurst(width * 0.5, -10, 44, Math.PI * 0.2, Math.PI * 0.8, 2, 7);

    secondWaveTimer = window.setTimeout(() => {
      secondWaveTimer = null;
      spawnBurst(width * 0.28, height * 0.2, 30, -Math.PI * 0.8, -Math.PI * 0.2, 5, 11);
      spawnBurst(width * 0.72, height * 0.2, 30, -Math.PI * 0.8, -Math.PI * 0.2, 5, 11);
    }, 620);

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.667, 2.2);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        p.vx *= Math.pow(p.drag, dt);
        p.vy = p.vy * Math.pow(p.drag, dt) + p.gravity * dt;
        p.wobblePhase += p.wobbleSpeed * dt;
        p.x += (p.vx + Math.sin(p.wobblePhase) * 0.75) * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.tilt += p.tiltSpeed * dt;

        const fadeStart = p.maxLife * 0.72;
        if (p.life > fadeStart) {
          p.alpha = Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart));
        }

        if (p.life >= p.maxLife || p.y > height + 40) {
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
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      if (particles.length > 0 || secondWaveTimer !== null) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (secondWaveTimer !== null) window.clearTimeout(secondWaveTimer);
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

  return (
    <>
      <canvas
        ref={confettiCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 h-full w-full"
      />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12 space-y-8">
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
    </>
  );
}
