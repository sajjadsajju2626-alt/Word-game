import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CategoryId,
  LetterSelectionMode,
  LiveRoomState,
  RoundAnswers,
} from '../game/types';

export interface MultiplayerSocketApi {
  connected: boolean;
  playerId: string | null;
  roomState: LiveRoomState | null;
  error: string | null;
  createRoom: (opts: {
    playerName: string;
    totalRounds: number;
    timerSeconds: number;
    letterMode: LetterSelectionMode;
  }) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  startRound: (manualLetter?: string) => void;
  updateAnswers: (answers: RoundAnswers) => void;
  submitAnswers: (answers: RoundAnswers) => void;
  toggleVeto: (playerId: string, categoryId: CategoryId) => void;
  finishGame: () => void;
  restartRoom: () => void;
  leaveRoom: () => void;
  clearError: () => void;
}

export function useMultiplayerSocket(): MultiplayerSocketApi {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<LiveRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ensureSocket = useCallback((): Promise<WebSocket> => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return Promise.resolve(wsRef.current);
    }

    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(url);

      socket.onopen = () => {
        wsRef.current = socket;
        setConnected(true);
        setError(null);
        resolve(socket);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === 'room:joined') {
            setPlayerId(msg.playerId);
            setRoomState(msg.state);
            setError(null);
          } else if (msg.type === 'room:state') {
            setRoomState(msg.state);
          } else if (msg.type === 'room:error') {
            setError(msg.message || 'Room error');
          }
        } catch {
          // Ignore malformed message
        }
      };

      socket.onerror = () => {
        setError('Connection failed. Please try again.');
        reject(new Error('WebSocket connection failed'));
      };

      socket.onclose = () => {
        setConnected(false);
        if (wsRef.current === socket) {
          wsRef.current = null;
        }
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        const socket = await ensureSocket();
        socket.send(JSON.stringify(payload));
      } catch {
        setError('Unable to reach multiplayer server.');
      }
    },
    [ensureSocket]
  );

  const createRoom = useCallback(
    (opts: {
      playerName: string;
      totalRounds: number;
      timerSeconds: number;
      letterMode: LetterSelectionMode;
    }) => {
      void sendMessage({ type: 'room:create', ...opts });
    },
    [sendMessage]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      void sendMessage({ type: 'room:join', roomCode, playerName });
    },
    [sendMessage]
  );

  const startRound = useCallback(
    (manualLetter?: string) => {
      void sendMessage({ type: 'room:start_round', letter: manualLetter });
    },
    [sendMessage]
  );

  const updateAnswers = useCallback(
    (answers: RoundAnswers) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'room:update_answers', answers }));
      }
    },
    []
  );

  const submitAnswers = useCallback(
    (answers: RoundAnswers) => {
      void sendMessage({ type: 'room:submit_answers', answers });
    },
    [sendMessage]
  );

  const toggleVeto = useCallback(
    (targetPlayerId: string, categoryId: CategoryId) => {
      void sendMessage({ type: 'room:toggle_veto', playerId: targetPlayerId, categoryId });
    },
    [sendMessage]
  );

  const finishGame = useCallback(() => {
    void sendMessage({ type: 'room:finish_game' });
  }, [sendMessage]);

  const restartRoom = useCallback(() => {
    void sendMessage({ type: 'room:restart' });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    setPlayerId(null);
    setRoomState(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    connected,
    playerId,
    roomState,
    error,
    createRoom,
    joinRoom,
    startRound,
    updateAnswers,
    submitAnswers,
    toggleVeto,
    finishGame,
    restartRoom,
    leaveRoom,
    clearError,
  };
}
