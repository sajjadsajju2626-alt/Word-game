import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABET, WORD_DICTIONARY } from './dictionary';
import {
  calculateStandings,
  normalizeWord,
  pickBotAnswers,
  pickNextLetter,
  scoreRound,
  validateWordForLetter,
} from './rules';

test('dictionary covers all 26 A-Z letters and 5 categories', () => {
  for (const letter of ALPHABET) {
    const entry = WORD_DICTIONARY[letter];
    assert.ok(entry, `Missing dictionary entry for ${letter}`);
    for (const cat of ['name', 'place', 'animal', 'plant', 'thing'] as const) {
      assert.ok(entry[cat].length >= 4, `Expected >= 4 words for ${letter}.${cat}`);
    }
  }
});

test('normalizeWord trims, lowercases, and strips trailing punctuation', () => {
  assert.equal(normalizeWord('  Kochi! '), 'kochi');
  assert.equal(normalizeWord('Fort   Kochi'), 'fort kochi');
});

test('validateWordForLetter enforces starting letter, length, and Malayalam initial mapping', () => {
  assert.equal(validateWordForLetter('', 'K', 'place').reason, 'blank');
  assert.equal(validateWordForLetter('K', 'K', 'place').reason, 'too_short');
  assert.equal(validateWordForLetter('Banana', 'K', 'plant').reason, 'wrong_letter');
  assert.equal(validateWordForLetter('kkkkk', 'K', 'thing').reason, 'gibberish');

  const kochi = validateWordForLetter('Kochi', 'K', 'place');
  assert.equal(kochi.valid, true);
  assert.equal(kochi.inDictionary, true);

  const customName = validateWordForLetter('Sajjad', 'S', 'name');
  assert.equal(customName.valid, true);

  // Malayalam initial letter mapping: കൊച്ചി starts with ക -> maps to K
  const mlPlace = validateWordForLetter('കൊച്ചി', 'K', 'place');
  assert.equal(mlPlace.valid, true);
});

test('scoreRound awards 10 for unique, 5 for shared, 0 for blank/wrong letter', () => {
  const result = scoreRound(1, 'K', [
    {
      player: { id: 'p1', name: 'Anu' },
      answers: {
        name: 'Karthik',
        place: 'Kochi',
        animal: 'Kingfisher',
        plant: 'Banana', // wrong letter -> 0
        thing: '', // blank -> 0
      },
    },
    {
      player: { id: 'p2', name: 'Meera' },
      answers: {
        name: 'Kalyani', // unique -> 10
        place: ' kochi ', // shared with Anu -> 5
        animal: 'Kangaroo', // unique -> 10
        plant: 'Kiwi', // unique -> 10
        thing: 'Kettle', // unique -> 10
      },
    },
  ]);

  const anu = result.playerScores.find((p) => p.playerId === 'p1')!;
  const meera = result.playerScores.find((p) => p.playerId === 'p2')!;

  assert.equal(anu.cells.name.points, 10);
  assert.equal(anu.cells.place.points, 5);
  assert.equal(anu.cells.animal.points, 10);
  assert.equal(anu.cells.plant.points, 0);
  assert.equal(anu.cells.plant.status, 'wrong_letter');
  assert.equal(anu.cells.thing.points, 0);
  assert.equal(anu.cells.thing.status, 'blank');
  assert.equal(anu.roundTotal, 25);

  assert.equal(meera.cells.place.points, 5);
  assert.equal(meera.cells.place.status, 'shared');
  assert.equal(meera.roundTotal, 45);
});

test('scoreRound handles appeal reject and approve overrides with 10/5/0 recalculation', () => {
  const result = scoreRound(
    1,
    'K',
    [
      {
        player: { id: 'p1', name: 'Anu' },
        answers: { name: 'Karthik', place: 'Kochi', animal: 'Kite', plant: 'Banana', thing: 'Key' },
      },
      {
        player: { id: 'p2', name: 'Meera' },
        answers: { name: 'Karthik', place: 'Kannur', animal: 'Koala', plant: 'Konna', thing: 'Kettle' },
      },
    ],
    {
      p2: { name: { decision: 'rejected', byPlayerName: 'Anu' } },
      p1: { plant: { decision: 'approved', byPlayerName: 'Meera' } },
    }
  );

  const anu = result.playerScores[0];
  const meera = result.playerScores[1];
  // Because Meera's "Karthik" was marked incorrect on appeal, Anu's "Karthik" becomes unique (10)
  assert.equal(anu.cells.name.points, 10);
  assert.equal(anu.cells.name.status, 'unique');
  assert.equal(meera.cells.name.points, 0);
  assert.equal(meera.cells.name.overriddenInvalid, true);
  // Because Anu's "Banana" was explicitly approved on appeal, it earns 10 points
  assert.equal(anu.cells.plant.points, 10);
  assert.equal(anu.cells.plant.appealDecision, 'approved');
});

test('pickBotAnswers returns valid letter-matched answers', () => {
  const answers = pickBotAnswers('M', 'sharp', () => 0.25);
  for (const val of Object.values(answers)) {
    if (val) {
      assert.equal(val[0].toUpperCase(), 'M');
    }
  }
});

test('pickNextLetter avoids already used letters when possible', () => {
  const used = ALPHABET.slice(0, 25); // A..Y used
  assert.equal(pickNextLetter(used), 'Z');
});

test('calculateStandings sorts totals and handles tie ranks', () => {
  const r1 = scoreRound(1, 'A', [
    {
      player: { id: 'p1', name: 'Asha' },
      answers: { name: 'Arun', place: 'Agra', animal: '', plant: '', thing: '' },
    },
    {
      player: { id: 'p2', name: 'Babu' },
      answers: { name: 'Amal', place: 'Aluva', animal: '', plant: '', thing: '' },
    },
    {
      player: { id: 'p3', name: 'Chitra' },
      answers: { name: 'Alice', place: '', animal: '', plant: '', thing: '' },
    },
  ]);

  const standings = calculateStandings(
    [
      { id: 'p1', name: 'Asha' },
      { id: 'p2', name: 'Babu' },
      { id: 'p3', name: 'Chitra' },
    ],
    [r1]
  );

  assert.equal(standings[0].totalScore, 20);
  assert.equal(standings[0].rank, 1);
  assert.equal(standings[1].totalScore, 20);
  assert.equal(standings[1].rank, 1);
  assert.equal(standings[2].totalScore, 10);
  assert.equal(standings[2].rank, 3);
});
