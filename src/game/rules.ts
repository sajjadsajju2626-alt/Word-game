import { ALPHABET, CATEGORIES, WORD_DICTIONARY } from './dictionary';
import type {
  BotDifficulty,
  CategoryId,
  Player,
  PlayerRoundScore,
  RoundAnswers,
  RoundResult,
  ScoredCell,
  StandingEntry,
} from './types';

// Maps Malayalam initial characters to English alphabet letters for bilingual input convenience
const MALAYALAM_INITIAL_MAP: Record<string, string[]> = {
  'അ': ['A'],
  'ആ': ['A'],
  'ഇ': ['I', 'E'],
  'ഈ': ['I', 'E'],
  'ഉ': ['U', 'O'],
  'ഊ': ['U'],
  'ഋ': ['R'],
  'എ': ['E'],
  'ഏ': ['E'],
  'ഐ': ['A', 'I'],
  'ഒ': ['O'],
  'ഓ': ['O'],
  'ഔ': ['O', 'A'],
  'ക': ['K', 'C'],
  'ഖ': ['K'],
  'ഗ': ['G'],
  'ഘ': ['G'],
  'ച': ['C'],
  'ഛ': ['C'],
  'ജ': ['J'],
  'ഝ': ['J'],
  'ട': ['T'],
  'ഠ': ['T'],
  'ഡ': ['D'],
  'ഢ': ['D'],
  'ത': ['T'],
  'ഥ': ['T'],
  'ദ': ['D'],
  'ധ': ['D'],
  'ന': ['N'],
  'പ': ['P'],
  'ഫ': ['F', 'P'],
  'ബ': ['B'],
  'ഭ': ['B'],
  'മ': ['M'],
  'യ': ['Y'],
  'ര': ['R'],
  'ല': ['L'],
  'വ': ['V', 'W'],
  'ശ': ['S'],
  'ഷ': ['S'],
  'സ': ['S'],
  'ഹ': ['H'],
  'ള': ['L'],
  'ഴ': ['Z', 'L'],
  'റ': ['R'],
};

export function createEmptyAnswers(): RoundAnswers {
  return {
    name: '',
    place: '',
    animal: '',
    plant: '',
    thing: '',
  };
}

export function normalizeWord(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9\u0D00-\u0D7F]+|[^a-z0-9\u0D00-\u0D7F]+$/g, '');
}

export function isInDictionary(word: string, letter: string, category: CategoryId): boolean {
  const norm = normalizeWord(word);
  if (!norm) return false;
  const list = WORD_DICTIONARY[letter.toUpperCase()]?.[category] ?? [];
  return list.some((entry) => normalizeWord(entry) === norm);
}

export interface WordValidationResult {
  valid: boolean;
  reason: 'ok' | 'blank' | 'too_short' | 'wrong_letter' | 'gibberish';
  message: string;
  inDictionary: boolean;
}

function startsWithTargetLetter(trimmed: string, upperTarget: string): boolean {
  const firstChar = trimmed[0];
  if (!firstChar) return false;
  const upperFirst = firstChar.toUpperCase();
  if (upperFirst === upperTarget) return true;
  const mlMatches = MALAYALAM_INITIAL_MAP[firstChar];
  if (mlMatches && mlMatches.includes(upperTarget)) return true;
  return false;
}

function looksLikeGibberish(norm: string): boolean {
  // Reject 3+ identical consecutive chars (e.g., "kkk", "aaab")
  if (/(.)\1\1/.test(norm)) return true;
  // If purely ASCII letters and length >= 3, require at least one vowel/y unless single-letter abbreviation
  if (/^[a-z\s]+$/.test(norm)) {
    const lettersOnly = norm.replace(/\s+/g, '');
    if (lettersOnly.length >= 3 && !/[aeiouy]/.test(lettersOnly)) {
      return true;
    }
    // Reject single-char repeats like "kxkx" or random keyboard mashing of >16 chars without spaces
    if (lettersOnly.length > 28) return true;
  }
  return false;
}

export function validateWordForLetter(
  raw: string,
  targetLetter: string,
  category?: CategoryId
): WordValidationResult {
  const trimmed = raw.trim();
  const upperTarget = targetLetter.toUpperCase();

  if (!trimmed) {
    return {
      valid: false,
      reason: 'blank',
      message: 'No answer entered',
      inDictionary: false,
    };
  }

  const norm = normalizeWord(trimmed);
  if (norm.length < 2) {
    return {
      valid: false,
      reason: 'too_short',
      message: 'Enter at least 2 letters',
      inDictionary: false,
    };
  }

  if (!startsWithTargetLetter(trimmed, upperTarget)) {
    return {
      valid: false,
      reason: 'wrong_letter',
      message: `Must start with "${upperTarget}"`,
      inDictionary: false,
    };
  }

  const inDict = category ? isInDictionary(trimmed, upperTarget, category) : false;

  if (!inDict && looksLikeGibberish(norm)) {
    return {
      valid: false,
      reason: 'gibberish',
      message: 'Word looks invalid',
      inDictionary: false,
    };
  }

  return {
    valid: true,
    reason: 'ok',
    message: inDict ? `Verified "${upperTarget}" word` : `Starts with "${upperTarget}"`,
    inDictionary: inDict,
  };
}

export interface PlayerSubmission {
  player: Player;
  answers: RoundAnswers;
}

export function scoreRound(
  roundNumber: number,
  targetLetter: string,
  submissions: PlayerSubmission[],
  overrides: Record<string, Record<CategoryId, boolean>> = {}
): RoundResult {
  const upperTarget = targetLetter.toUpperCase();

  // First pass: validate every player's cell and count valid normalized words per category
  const wordCounts: Record<CategoryId, Map<string, number>> = {
    name: new Map(),
    place: new Map(),
    animal: new Map(),
    plant: new Map(),
    thing: new Map(),
  };

  const preValidated = submissions.map(({ player, answers }) => {
    const validations = {} as Record<CategoryId, WordValidationResult>;
    for (const cat of CATEGORIES) {
      const raw = answers[cat.id] ?? '';
      const result = validateWordForLetter(raw, upperTarget, cat.id);
      const isOverriddenInvalid = overrides[player.id]?.[cat.id] === true;
      validations[cat.id] = result;
      if (result.valid && !isOverriddenInvalid) {
        const norm = normalizeWord(raw);
        wordCounts[cat.id].set(norm, (wordCounts[cat.id].get(norm) ?? 0) + 1);
      }
    }
    return { player, answers, validations };
  });

  // Second pass: assign 10 / 5 / 0 points
  const playerScores: PlayerRoundScore[] = preValidated.map(({ player, answers, validations }) => {
    const cells = {} as Record<CategoryId, ScoredCell>;
    let roundTotal = 0;

    for (const cat of CATEGORIES) {
      const raw = (answers[cat.id] ?? '').trim();
      const norm = normalizeWord(raw);
      const validation = validations[cat.id];
      const overriddenInvalid = overrides[player.id]?.[cat.id] === true;

      if (!validation.valid) {
        cells[cat.id] = {
          raw,
          normalized: norm,
          points: 0,
          status: validation.reason === 'blank' ? 'blank' : validation.reason === 'wrong_letter' ? 'wrong_letter' : 'invalid',
          reason: validation.message,
          inDictionary: false,
        };
      } else if (overriddenInvalid) {
        cells[cat.id] = {
          raw,
          normalized: norm,
          points: 0,
          status: 'invalid',
          reason: 'Challenged as invalid',
          inDictionary: validation.inDictionary,
          overriddenInvalid: true,
        };
      } else {
        const count = wordCounts[cat.id].get(norm) ?? 1;
        const isShared = count > 1;
        const points: 5 | 10 = isShared ? 5 : 10;
        roundTotal += points;
        cells[cat.id] = {
          raw,
          normalized: norm,
          points,
          status: isShared ? 'shared' : 'unique',
          reason: isShared ? 'Shared word (+5)' : 'Unique word (+10)',
          inDictionary: validation.inDictionary,
        };
      }
    }

    return {
      playerId: player.id,
      playerName: player.name,
      isBot: player.isBot,
      cells,
      roundTotal,
    };
  });

  return {
    roundNumber,
    letter: upperTarget,
    playerScores,
  };
}

export function pickBotAnswers(
  targetLetter: string,
  difficulty: BotDifficulty = 'casual',
  rng: () => number = Math.random
): RoundAnswers {
  const upperTarget = targetLetter.toUpperCase();
  const dict = WORD_DICTIONARY[upperTarget];
  const answers = createEmptyAnswers();

  if (!dict) return answers;

  const blankChance = difficulty === 'casual' ? 0.14 : 0.03;

  for (const cat of CATEGORIES) {
    const pool = dict[cat.id];
    if (!pool || pool.length === 0) continue;
    if (rng() < blankChance) {
      answers[cat.id] = '';
    } else {
      const idx = Math.floor(rng() * pool.length);
      answers[cat.id] = pool[idx];
    }
  }

  return answers;
}

export function getSuggestionsForCategory(
  targetLetter: string,
  category: CategoryId,
  query: string,
  limit = 5
): string[] {
  const upperTarget = targetLetter.toUpperCase();
  const pool = WORD_DICTIONARY[upperTarget]?.[category] ?? [];
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return pool.slice(0, limit);
  }
  return pool
    .filter((word) => word.toLowerCase().startsWith(trimmed) || word.toLowerCase().includes(trimmed))
    .slice(0, limit);
}

export function pickNextLetter(usedLetters: string[], rng: () => number = Math.random): string {
  // Exclude X unless most letters are exhausted, or keep all 26 available with fair weighting
  const usedSet = new Set(usedLetters.map((l) => l.toUpperCase()));
  const available = ALPHABET.filter((l) => !usedSet.has(l));
  const pool = available.length > 0 ? available : ALPHABET;
  const idx = Math.floor(rng() * pool.length);
  return pool[idx];
}

export function calculateStandings(players: Player[], roundResults: RoundResult[]): StandingEntry[] {
  const map = new Map<string, StandingEntry>();

  for (const p of players) {
    map.set(p.id, {
      playerId: p.id,
      playerName: p.name,
      isBot: p.isBot,
      totalScore: 0,
      uniqueCount: 0,
      sharedCount: 0,
      roundScores: [],
      rank: 1,
    });
  }

  for (const round of roundResults) {
    for (const ps of round.playerScores) {
      let entry = map.get(ps.playerId);
      if (!entry) {
        entry = {
          playerId: ps.playerId,
          playerName: ps.playerName,
          isBot: ps.isBot,
          totalScore: 0,
          uniqueCount: 0,
          sharedCount: 0,
          roundScores: [],
          rank: 1,
        };
        map.set(ps.playerId, entry);
      }
      entry.totalScore += ps.roundTotal;
      entry.roundScores.push(ps.roundTotal);
      for (const cat of CATEGORIES) {
        if (ps.cells[cat.id].status === 'unique') entry.uniqueCount += 1;
        if (ps.cells[cat.id].status === 'shared') entry.sharedCount += 1;
      }
    }
  }

  const sorted = Array.from(map.values()).sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.uniqueCount !== a.uniqueCount) return b.uniqueCount - a.uniqueCount;
    return a.playerName.localeCompare(b.playerName);
  });

  // Assign competition ranking (ties share rank)
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].totalScore === sorted[i - 1].totalScore) {
      sorted[i].rank = sorted[i - 1].rank;
    } else {
      sorted[i].rank = i + 1;
    }
  }

  return sorted;
}
