import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { HandoffScreen } from './components/HandoffScreen';
import { LiveRoomLobby } from './components/LiveRoomLobby';
import { PauseModal } from './components/PauseModal';
import { PlaySheet } from './components/PlaySheet';
import { PodiumScreen } from './components/PodiumScreen';
import { RoundResults } from './components/RoundResults';
import { TitleScreen } from './components/TitleScreen';
import {
  calculateStandings,
  createEmptyAnswers,
  pickBotAnswers,
  pickNextLetter,
  scoreRound,
  type PlayerSubmission,
} from './game/rules';
import type {
  BotDifficulty,
  CategoryId,
  GameMode,
  GamePhase,
  LanguageMode,
  LetterSelectionMode,
  Player,
  RoundAnswers,
  RoundResult,
} from './game/types';
import { useMultiplayerSocket } from './hooks/useMultiplayerSocket';
import { soundFx } from './utils/sound';

const BOT_NAMES = ['Kuttappan Bot', 'Minnu Bot', 'Appu Bot'];

export default function App() {
  // Setup & Preferences
  const [mode, setMode] = useState<GameMode>('solo');
  const [language, setLanguage] = useState<LanguageMode>('bilingual');
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [letterMode, setLetterMode] = useState<LetterSelectionMode>('random');
  const [manualLetter, setManualLetter] = useState<string>('K');

  // Player Rosters
  const [soloPlayerName, setSoloPlayerName] = useState<string>('Player 1');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('casual');
  const [botCount, setBotCount] = useState<number>(1);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([
    { id: 'lp_1', name: 'Player 1' },
    { id: 'lp_2', name: 'Player 2' },
  ]);

  // Live Room inputs & hook
  const [liveName, setLiveName] = useState<string>('Player 1');
  const [joinCode, setJoinCode] = useState<string>('');
  const socket = useMultiplayerSocket();

  // Local Game Session State
  const [phase, setPhase] = useState<GamePhase>('title');
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [targetLetter, setTargetLetter] = useState<string>('K');
  const [usedLetters, setUsedLetters] = useState<string[]>([]);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [answers, setAnswers] = useState<RoundAnswers>(createEmptyAnswers);
  const [roundSubmissions, setRoundSubmissions] = useState<PlayerSubmission[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Record<CategoryId, boolean>>>({});

  // Live Room local sheet tracking
  const [liveAnswers, setLiveAnswers] = useState<RoundAnswers>(createEmptyAnswers);
  const lastLiveRoundRef = useRef<number>(0);
  const lastUrgentSecRef = useRef<number>(-1);

  const isLiveMode = mode === 'live_room' && socket.roomState !== null;

  // Sync sound mute
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundFx.setMuted(next);
      return next;
    });
  }, []);

  // Derive active body data-state for testability
  const effectiveState = useMemo(() => {
    if (isLiveMode && socket.roomState) {
      if (socket.roomState.phase === 'lobby') return 'lobby';
      return socket.roomState.phase;
    }
    if (paused && phase === 'playing') return 'paused';
    return phase;
  }, [isLiveMode, socket.roomState, paused, phase]);

  useEffect(() => {
    document.body.dataset.state = effectiveState;
  }, [effectiveState]);

  // Reset liveAnswers when a new live round starts
  useEffect(() => {
    if (!socket.roomState) {
      lastLiveRoundRef.current = 0;
      return;
    }
    if (
      socket.roomState.phase === 'playing' &&
      socket.roomState.currentRound !== lastLiveRoundRef.current
    ) {
      lastLiveRoundRef.current = socket.roomState.currentRound;
      setLiveAnswers(createEmptyAnswers());
      soundFx.playStart();
    }
    if (socket.roomState.phase === 'results') {
      soundFx.playTimeUp();
    }
    if (socket.roomState.phase === 'gameover') {
      soundFx.playVictory();
    }
  }, [socket.roomState]);

  // Live Room urgent countdown sound
  useEffect(() => {
    if (!isLiveMode || !socket.roomState || socket.roomState.phase !== 'playing') return;
    const t = socket.roomState.timeLeft;
    if (t > 0 && t <= 10 && lastUrgentSecRef.current !== t) {
      lastUrgentSecRef.current = t;
      soundFx.playUrgentTick();
    }
  }, [isLiveMode, socket.roomState]);

  const buildLocalRoster = useCallback((): Player[] => {
    if (mode === 'solo') {
      const human: Player = {
        id: 'human_1',
        name: soloPlayerName.trim() || 'Player 1',
      };
      const bots: Player[] = Array.from({ length: botCount }, (_, i) => ({
        id: `bot_${i + 1}`,
        name: BOT_NAMES[i] ?? `Bot ${i + 1}`,
        isBot: true,
      }));
      return [human, ...bots];
    }
    return localPlayers.map((p, idx) => ({
      id: p.id,
      name: p.name.trim() || `Player ${idx + 1}`,
    }));
  }, [mode, soloPlayerName, botCount, localPlayers]);

  const startNewRound = useCallback(
    (
      roundNum: number,
      roster: Player[],
      priorUsed: string[],
      chosenLetterMode: LetterSelectionMode,
      chosenManualLetter: string,
      gameMode: GameMode
    ) => {
      const letter =
        chosenLetterMode === 'manual'
          ? chosenManualLetter.toUpperCase()
          : pickNextLetter(priorUsed);

      setCurrentRound(roundNum);
      setTargetLetter(letter);
      setUsedLetters(priorUsed.includes(letter) ? priorUsed : [...priorUsed, letter]);
      setTurnIndex(0);
      setRoundSubmissions([]);
      setOverrides({});
      setAnswers(createEmptyAnswers());
      setTimeLeft(timerSeconds);
      setPaused(false);
      lastUrgentSecRef.current = -1;

      if (gameMode === 'pass_and_play') {
        setPhase('handoff');
      } else {
        setPhase('playing');
        soundFx.playStart();
      }
    },
    [timerSeconds]
  );

  const startLocalGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const roster = buildLocalRoster();
    setActivePlayers(roster);
    setRoundResults([]);
    startNewRound(1, roster, [], letterMode, manualLetter, mode);
  }, [buildLocalRoster, startNewRound, letterMode, manualLetter, mode]);

  // ?autostart=1 support for immediate test entry
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const roster: Player[] = [
        { id: 'human_1', name: 'Player 1' },
        { id: 'bot_1', name: BOT_NAMES[0], isBot: true },
      ];
      setMode('solo');
      setActivePlayers(roster);
      setRoundResults([]);
      startNewRound(1, roster, [], 'manual', 'K', 'solo');
    }
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Finalize current human turn in Solo / Pass & Play
  const submitCurrentTurn = useCallback(
    (isTimeout = false) => {
      const humanPlayers = activePlayers.filter((p) => !p.isBot);
      const currentPlayer = humanPlayers[turnIndex];
      if (!currentPlayer) return;

      if (isTimeout) {
        soundFx.playTimeUp();
      } else {
        soundFx.playSubmit();
      }

      const nextSubs: PlayerSubmission[] = [
        ...roundSubmissions,
        { player: currentPlayer, answers },
      ];

      if (turnIndex + 1 < humanPlayers.length) {
        setRoundSubmissions(nextSubs);
        setTurnIndex(turnIndex + 1);
        setAnswers(createEmptyAnswers());
        setTimeLeft(timerSeconds);
        setPhase('handoff');
        return;
      }

      // All human turns done -> add bot submissions if solo
      const botSubs: PlayerSubmission[] = activePlayers
        .filter((p) => p.isBot)
        .map((bot) => ({
          player: bot,
          answers: pickBotAnswers(targetLetter, botDifficulty),
        }));

      const allSubs = [...nextSubs, ...botSubs];
      setRoundSubmissions(allSubs);

      const scored = scoreRound(currentRound, targetLetter, allSubs, {});
      setRoundResults((prev) => [...prev, scored]);
      setPhase('results');
    },
    [
      activePlayers,
      turnIndex,
      roundSubmissions,
      answers,
      timerSeconds,
      targetLetter,
      botDifficulty,
      currentRound,
    ]
  );

  // Local Countdown Timer
  useEffect(() => {
    if (isLiveMode || phase !== 'playing' || paused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        const next = prev - 1;
        if (next <= 10 && next > 0) {
          soundFx.playUrgentTick();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveMode, phase, paused]);

  // Trigger auto-submit when timer hits 0
  useEffect(() => {
    if (!isLiveMode && phase === 'playing' && !paused && timeLeft === 0) {
      submitCurrentTurn(true);
    }
  }, [isLiveMode, phase, paused, timeLeft, submitCurrentTurn]);

  // Global keyboard shortcuts (Escape to pause/resume)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isLiveMode) return;
      if (e.key === 'Escape' && phase === 'playing') {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (
        phase === 'title' &&
        (e.key === 'Enter' || e.key === ' ') &&
        mode !== 'live_room' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLButtonElement)
      ) {
        e.preventDefault();
        startLocalGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLiveMode, phase, mode, startLocalGame]);

  const handleToggleLocalVeto = (playerId: string, categoryId: CategoryId) => {
    const updatedOverrides = {
      ...overrides,
      [playerId]: {
        ...(overrides[playerId] ?? {
          name: false,
          place: false,
          animal: false,
          plant: false,
          thing: false,
        }),
        [categoryId]: !(overrides[playerId]?.[categoryId] ?? false),
      },
    };
    setOverrides(updatedOverrides);

    const recalculated = scoreRound(
      currentRound,
      targetLetter,
      roundSubmissions,
      updatedOverrides
    );
    setRoundResults((prev) =>
      prev.map((r) => (r.roundNumber === currentRound ? recalculated : r))
    );
  };

  const handleLocalNextRound = () => {
    startNewRound(
      currentRound + 1,
      activePlayers,
      usedLetters,
      letterMode,
      manualLetter,
      mode
    );
  };

  const handleFinishLocalGame = () => {
    soundFx.playVictory();
    setPhase('gameover');
  };

  const handleRestartRound = () => {
    setPaused(false);
    setAnswers(createEmptyAnswers());
    setTimeLeft(timerSeconds);
  };

  const handleBackToMenu = () => {
    setPaused(false);
    setPhase('title');
    if (isLiveMode) {
      socket.leaveRoom();
    }
  };

  // --- LIVE ROOM RENDERING ---
  if (isLiveMode && socket.roomState && socket.playerId) {
    const room = socket.roomState;
    const isHost = room.hostId === socket.playerId;
    const liveStandings = calculateStandings(room.players, room.roundResults);

    if (room.phase === 'lobby') {
      return (
        <div className="min-h-screen ledger-canvas">
          <LiveRoomLobby
            roomState={room}
            playerId={socket.playerId}
            manualLetter={manualLetter}
            onManualLetterChange={setManualLetter}
            onStartRound={() =>
              socket.startRound(room.letterMode === 'manual' ? manualLetter : undefined)
            }
            onLeaveRoom={socket.leaveRoom}
          />
        </div>
      );
    }

    if (room.phase === 'playing') {
      const me = room.players.find((p) => p.id === socket.playerId);
      const alreadySubmitted = room.submittedPlayerIds.includes(socket.playerId);

      return (
        <div className="min-h-screen ledger-canvas">
          <GameHud
            currentRound={room.currentRound}
            totalRounds={room.totalRounds}
            targetLetter={room.targetLetter}
            timeLeft={room.timeLeft}
            timerSeconds={room.timerSeconds}
            playerName={me?.name}
            roomCode={room.roomCode}
            muted={muted}
            onToggleMute={toggleMute}
          />
          <PlaySheet
            targetLetter={room.targetLetter}
            language={language}
            answers={liveAnswers}
            onChangeAnswer={(cat, val) => {
              const next = { ...liveAnswers, [cat]: val };
              setLiveAnswers(next);
              socket.updateAnswers(next);
            }}
            onSubmit={() => {
              soundFx.playSubmit();
              socket.submitAnswers(liveAnswers);
            }}
            alreadySubmitted={alreadySubmitted}
            submittedCount={room.submittedPlayerIds.length}
            totalPlayers={room.players.filter((p) => p.connected !== false).length}
          />
        </div>
      );
    }

    if (room.phase === 'results' && room.lastRoundResult) {
      return (
        <div className="min-h-screen ledger-canvas">
          <RoundResults
            result={room.lastRoundResult}
            standings={liveStandings}
            totalRounds={room.totalRounds}
            language={language}
            letterMode={room.letterMode}
            nextManualLetter={manualLetter}
            onNextManualLetterChange={setManualLetter}
            canModerate={isHost}
            onToggleVeto={socket.toggleVeto}
            onNextRound={() =>
              socket.startRound(room.letterMode === 'manual' ? manualLetter : undefined)
            }
            onFinishGame={socket.finishGame}
            usedLetters={room.usedLetters}
          />
        </div>
      );
    }

    if (room.phase === 'gameover') {
      return (
        <div className="min-h-screen ledger-canvas">
          <PodiumScreen
            standings={liveStandings}
            roundResults={room.roundResults}
            canControl={isHost}
            onPlayAgain={socket.restartRoom}
            onBackToMenu={handleBackToMenu}
          />
        </div>
      );
    }
  }

  // --- LOCAL / SOLO / PASS-AND-PLAY RENDERING ---
  const localStandings = calculateStandings(activePlayers, roundResults);
  const currentHumanPlayer = activePlayers.filter((p) => !p.isBot)[turnIndex];
  const latestRoundResult = roundResults[roundResults.length - 1];

  return (
    <div className="min-h-screen ledger-canvas">
      {phase === 'title' && (
        <TitleScreen
          mode={mode}
          onModeChange={(m) => {
            setMode(m);
            socket.clearError();
          }}
          language={language}
          onLanguageChange={setLanguage}
          totalRounds={totalRounds}
          onTotalRoundsChange={setTotalRounds}
          timerSeconds={timerSeconds}
          onTimerSecondsChange={setTimerSeconds}
          letterMode={letterMode}
          onLetterModeChange={setLetterMode}
          manualLetter={manualLetter}
          onManualLetterChange={setManualLetter}
          soloPlayerName={soloPlayerName}
          onSoloPlayerNameChange={setSoloPlayerName}
          botDifficulty={botDifficulty}
          onBotDifficultyChange={setBotDifficulty}
          botCount={botCount}
          onBotCountChange={setBotCount}
          localPlayers={localPlayers}
          onLocalPlayerNameChange={(id, name) =>
            setLocalPlayers((prev) =>
              prev.map((p) => (p.id === id ? { ...p, name } : p))
            )
          }
          onAddLocalPlayer={() =>
            setLocalPlayers((prev) =>
              prev.length < 6
                ? [...prev, { id: `lp_${Date.now()}`, name: `Player ${prev.length + 1}` }]
                : prev
            )
          }
          onRemoveLocalPlayer={(id) =>
            setLocalPlayers((prev) => prev.filter((p) => p.id !== id))
          }
          joinCode={joinCode}
          onJoinCodeChange={setJoinCode}
          liveName={liveName}
          onLiveNameChange={setLiveName}
          liveError={socket.error}
          onStartLocalGame={startLocalGame}
          onCreateLiveRoom={() =>
            socket.createRoom({
              playerName: liveName,
              totalRounds,
              timerSeconds,
              letterMode,
            })
          }
          onJoinLiveRoom={() => socket.joinRoom(joinCode, liveName)}
        />
      )}

      {phase === 'handoff' && currentHumanPlayer && (
        <HandoffScreen
          playerName={currentHumanPlayer.name}
          playerIndex={turnIndex}
          totalPlayers={activePlayers.filter((p) => !p.isBot).length}
          currentRound={currentRound}
          totalRounds={totalRounds}
          targetLetter={targetLetter}
          onReveal={() => {
            setPhase('playing');
            soundFx.playStart();
          }}
        />
      )}

      {phase === 'playing' && (
        <>
          <GameHud
            currentRound={currentRound}
            totalRounds={totalRounds}
            targetLetter={targetLetter}
            timeLeft={timeLeft}
            timerSeconds={timerSeconds}
            playerName={currentHumanPlayer?.name}
            muted={muted}
            onToggleMute={toggleMute}
            onPause={() => setPaused(true)}
          />
          <PlaySheet
            targetLetter={targetLetter}
            language={language}
            answers={answers}
            onChangeAnswer={(cat, val) =>
              setAnswers((prev) => ({ ...prev, [cat]: val }))
            }
            onSubmit={() => submitCurrentTurn(false)}
          />
          {paused && (
            <PauseModal
              onResume={() => setPaused(false)}
              onRestartRound={handleRestartRound}
              onExitToMenu={handleBackToMenu}
            />
          )}
        </>
      )}

      {phase === 'results' && latestRoundResult && (
        <RoundResults
          result={latestRoundResult}
          standings={localStandings}
          totalRounds={totalRounds}
          language={language}
          letterMode={letterMode}
          nextManualLetter={manualLetter}
          onNextManualLetterChange={setManualLetter}
          canModerate={true}
          onToggleVeto={handleToggleLocalVeto}
          onNextRound={handleLocalNextRound}
          onFinishGame={handleFinishLocalGame}
          usedLetters={usedLetters}
        />
      )}

      {phase === 'gameover' && (
        <PodiumScreen
          standings={localStandings}
          roundResults={roundResults}
          onPlayAgain={startLocalGame}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}
