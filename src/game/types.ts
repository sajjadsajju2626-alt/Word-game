export type CategoryId = 'name' | 'place' | 'animal' | 'plant' | 'thing';

export type GameMode = 'solo' | 'pass_and_play' | 'live_room';

export type LanguageMode = 'bilingual' | 'english' | 'malayalam';

export type GamePhase = 'title' | 'handoff' | 'playing' | 'appeal' | 'results' | 'gameover';

export type LetterSelectionMode = 'random' | 'manual';

export type BotDifficulty = 'casual' | 'sharp';

export type AppealDecision = 'auto' | 'approved' | 'rejected';

export interface AppealEntry {
  decision: AppealDecision;
  byPlayerName?: string;
}

export type AppealMap = Record<string, Partial<Record<CategoryId, AppealEntry>>>;

export interface CategoryMeta {
  id: CategoryId;
  en: string;
  ml: string;
  placeholderEn: string;
  placeholderMl: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
}

export interface Player {
  id: string;
  name: string;
  isBot?: boolean;
  connected?: boolean;
}

export type RoundAnswers = Record<CategoryId, string>;

export type ScoreStatus = 'unique' | 'shared' | 'blank' | 'wrong_letter' | 'invalid';

export interface ScoredCell {
  raw: string;
  normalized: string;
  points: 0 | 5 | 10;
  status: ScoreStatus;
  reason: string;
  inDictionary: boolean;
  autoValid: boolean;
  appealDecision: AppealDecision;
  appealedBy?: string;
  overriddenInvalid?: boolean;
}

export interface PlayerRoundScore {
  playerId: string;
  playerName: string;
  isBot?: boolean;
  cells: Record<CategoryId, ScoredCell>;
  roundTotal: number;
}

export interface RoundResult {
  roundNumber: number;
  letter: string;
  playerScores: PlayerRoundScore[];
}

export interface StandingEntry {
  playerId: string;
  playerName: string;
  isBot?: boolean;
  totalScore: number;
  uniqueCount: number;
  sharedCount: number;
  roundScores: number[];
  rank: number;
}

export interface LiveRoomState {
  roomCode: string;
  hostId: string;
  phase: 'lobby' | 'playing' | 'appeal' | 'results' | 'gameover';
  players: Player[];
  currentRound: number;
  totalRounds: number;
  timerSeconds: number;
  timeLeft: number;
  targetLetter: string;
  letterMode: LetterSelectionMode;
  usedLetters: string[];
  submittedPlayerIds: string[];
  roundResults: RoundResult[];
  lastRoundResult: RoundResult | null;
}
