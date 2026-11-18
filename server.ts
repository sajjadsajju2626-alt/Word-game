import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createEmptyAnswers, pickNextLetter, scoreRound } from './src/game/rules';
import type {
  CategoryId,
  LetterSelectionMode,
  LiveRoomState,
  Player,
  RoundAnswers,
} from './src/game/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InternalRoom {
  state: LiveRoomState;
  answersByPlayer: Map<string, RoundAnswers>;
  overrides: Record<string, Record<CategoryId, boolean>>;
  clients: Map<string, WebSocket>;
  timerHandle: ReturnType<typeof setInterval> | null;
}

const rooms = new Map<string, InternalRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function generatePlayerId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

function broadcastRoom(room: InternalRoom) {
  const payload = JSON.stringify({ type: 'room:state', state: room.state });
  for (const ws of room.clients.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function stopRoomTimer(room: InternalRoom) {
  if (room.timerHandle) {
    clearInterval(room.timerHandle);
    room.timerHandle = null;
  }
}

function finalizeRound(room: InternalRoom) {
  stopRoomTimer(room);
  if (room.state.phase !== 'playing') return;

  const submissions = room.state.players.map((player) => ({
    player,
    answers: room.answersByPlayer.get(player.id) ?? createEmptyAnswers(),
  }));

  const result = scoreRound(
    room.state.currentRound,
    room.state.targetLetter,
    submissions,
    room.overrides
  );

  const existingIdx = room.state.roundResults.findIndex(
    (r) => r.roundNumber === result.roundNumber
  );
  if (existingIdx >= 0) {
    room.state.roundResults[existingIdx] = result;
  } else {
    room.state.roundResults.push(result);
  }
  room.state.lastRoundResult = result;
  room.state.phase = 'results';
  broadcastRoom(room);
}

function startRoundOnRoom(room: InternalRoom, manualLetter?: string) {
  stopRoomTimer(room);

  const nextRound = room.state.currentRound + 1;
  const letter =
    manualLetter && /^[A-Z]$/i.test(manualLetter.trim())
      ? manualLetter.trim().toUpperCase()
      : pickNextLetter(room.state.usedLetters);

  room.state.currentRound = nextRound;
  room.state.targetLetter = letter;
  if (!room.state.usedLetters.includes(letter)) {
    room.state.usedLetters.push(letter);
  }
  room.state.timeLeft = room.state.timerSeconds;
  room.state.submittedPlayerIds = [];
  room.state.lastRoundResult = null;
  room.state.phase = 'playing';
  room.answersByPlayer.clear();
  room.overrides = {};

  for (const p of room.state.players) {
    room.answersByPlayer.set(p.id, createEmptyAnswers());
  }

  broadcastRoom(room);

  room.timerHandle = setInterval(() => {
    if (room.state.phase !== 'playing') {
      stopRoomTimer(room);
      return;
    }
    room.state.timeLeft = Math.max(0, room.state.timeLeft - 1);
    if (room.state.timeLeft <= 0) {
      finalizeRound(room);
    } else {
      broadcastRoom(room);
    }
  }, 1000);
}

async function createServer() {
  const app = express();
  const server = http.createServer(app);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let attachedRoomCode: string | null = null;
    let attachedPlayerId: string | null = null;

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = String(msg.type ?? '');

      if (type === 'room:create') {
        const playerName = String(msg.playerName ?? 'Host').trim().slice(0, 24) || 'Host';
        const totalRounds = Math.min(10, Math.max(1, Number(msg.totalRounds ?? 3)));
        const timerSeconds = Math.min(180, Math.max(15, Number(msg.timerSeconds ?? 60)));
        const letterMode = (msg.letterMode === 'manual' ? 'manual' : 'random') as LetterSelectionMode;

        const roomCode = generateRoomCode();
        const playerId = generatePlayerId();
        const hostPlayer: Player = { id: playerId, name: playerName, connected: true };

        const room: InternalRoom = {
          state: {
            roomCode,
            hostId: playerId,
            phase: 'lobby',
            players: [hostPlayer],
            currentRound: 0,
            totalRounds,
            timerSeconds,
            timeLeft: timerSeconds,
            targetLetter: 'A',
            letterMode,
            usedLetters: [],
            submittedPlayerIds: [],
            roundResults: [],
            lastRoundResult: null,
          },
          answersByPlayer: new Map(),
          overrides: {},
          clients: new Map([[playerId, ws]]),
          timerHandle: null,
        };

        rooms.set(roomCode, room);
        attachedRoomCode = roomCode;
        attachedPlayerId = playerId;

        ws.send(JSON.stringify({ type: 'room:joined', playerId, state: room.state }));
        return;
      }

      if (type === 'room:join') {
        const roomCode = String(msg.roomCode ?? '').trim().toUpperCase();
        const playerName = String(msg.playerName ?? 'Player').trim().slice(0, 24) || 'Player';
        const room = rooms.get(roomCode);

        if (!room) {
          ws.send(JSON.stringify({ type: 'room:error', message: `Room "${roomCode}" not found.` }));
          return;
        }

        if (room.state.players.length >= 8) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'Room is full (max 8 players).' }));
          return;
        }

        const playerId = generatePlayerId();
        const newPlayer: Player = { id: playerId, name: playerName, connected: true };
        room.state.players.push(newPlayer);
        room.clients.set(playerId, ws);
        if (room.state.phase === 'playing') {
          room.answersByPlayer.set(playerId, createEmptyAnswers());
        }

        attachedRoomCode = roomCode;
        attachedPlayerId = playerId;

        ws.send(JSON.stringify({ type: 'room:joined', playerId, state: room.state }));
        broadcastRoom(room);
        return;
      }

      if (!attachedRoomCode || !attachedPlayerId) return;
      const room = rooms.get(attachedRoomCode);
      if (!room) return;

      if (type === 'room:start_round') {
        if (attachedPlayerId !== room.state.hostId) return;
        const manualLetter = typeof msg.letter === 'string' ? msg.letter : undefined;
        startRoundOnRoom(room, manualLetter);
        return;
      }

      if (type === 'room:update_answers') {
        if (room.state.phase !== 'playing') return;
        const answers = msg.answers as RoundAnswers | undefined;
        if (!answers) return;
        room.answersByPlayer.set(attachedPlayerId, {
          name: String(answers.name ?? ''),
          place: String(answers.place ?? ''),
          animal: String(answers.animal ?? ''),
          plant: String(answers.plant ?? ''),
          thing: String(answers.thing ?? ''),
        });
        return;
      }

      if (type === 'room:submit_answers') {
        if (room.state.phase !== 'playing') return;
        const answers = msg.answers as RoundAnswers | undefined;
        if (answers) {
          room.answersByPlayer.set(attachedPlayerId, {
            name: String(answers.name ?? ''),
            place: String(answers.place ?? ''),
            animal: String(answers.animal ?? ''),
            plant: String(answers.plant ?? ''),
            thing: String(answers.thing ?? ''),
          });
        }
        if (!room.state.submittedPlayerIds.includes(attachedPlayerId)) {
          room.state.submittedPlayerIds.push(attachedPlayerId);
        }

        const connectedIds = room.state.players
          .filter((p) => p.connected !== false)
          .map((p) => p.id);
        const allSubmitted =
          connectedIds.length > 0 &&
          connectedIds.every((id) => room.state.submittedPlayerIds.includes(id));

        if (allSubmitted) {
          finalizeRound(room);
        } else {
          broadcastRoom(room);
        }
        return;
      }

      if (type === 'room:toggle_veto') {
        if (attachedPlayerId !== room.state.hostId || room.state.phase !== 'results') return;
        const targetPlayerId = String(msg.playerId ?? '');
        const categoryId = String(msg.categoryId ?? '') as CategoryId;
        if (!targetPlayerId || !categoryId) return;

        room.overrides[targetPlayerId] = room.overrides[targetPlayerId] ?? {
          name: false,
          place: false,
          animal: false,
          plant: false,
          thing: false,
        };
        room.overrides[targetPlayerId][categoryId] = !room.overrides[targetPlayerId][categoryId];

        const submissions = room.state.players.map((player) => ({
          player,
          answers: room.answersByPlayer.get(player.id) ?? createEmptyAnswers(),
        }));
        const updated = scoreRound(
          room.state.currentRound,
          room.state.targetLetter,
          submissions,
          room.overrides
        );
        const idx = room.state.roundResults.findIndex((r) => r.roundNumber === updated.roundNumber);
        if (idx >= 0) {
          room.state.roundResults[idx] = updated;
        }
        room.state.lastRoundResult = updated;
        broadcastRoom(room);
        return;
      }

      if (type === 'room:finish_game') {
        if (attachedPlayerId !== room.state.hostId) return;
        stopRoomTimer(room);
        room.state.phase = 'gameover';
        broadcastRoom(room);
        return;
      }

      if (type === 'room:restart') {
        if (attachedPlayerId !== room.state.hostId) return;
        stopRoomTimer(room);
        room.state.phase = 'lobby';
        room.state.currentRound = 0;
        room.state.usedLetters = [];
        room.state.roundResults = [];
        room.state.lastRoundResult = null;
        room.state.submittedPlayerIds = [];
        room.answersByPlayer.clear();
        room.overrides = {};
        broadcastRoom(room);
      }
    });

    ws.on('close', () => {
      if (!attachedRoomCode || !attachedPlayerId) return;
      const room = rooms.get(attachedRoomCode);
      if (!room) return;
      room.clients.delete(attachedPlayerId);
      const player = room.state.players.find((p) => p.id === attachedPlayerId);
      if (player) {
        player.connected = false;
      }
      if (room.clients.size === 0) {
        stopRoomTimer(room);
        rooms.delete(attachedRoomCode);
      } else {
        // Reassign host if host disconnected
        if (room.state.hostId === attachedPlayerId) {
          const nextConnected = room.state.players.find((p) => p.connected !== false);
          if (nextConnected) {
            room.state.hostId = nextConnected.id;
          }
        }
        broadcastRoom(room);
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

createServer();
