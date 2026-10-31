const {test} = require('node:test');
const assert = require('node:assert/strict');
const {WORDS, nextWord} = require('../words');

test('expanded word bank contains unique drawable words', () => {
  assert.ok(WORDS.length >= 140);
  assert.equal(new Set(WORDS).size, WORDS.length);
  assert.ok(WORDS.every(word => /^[A-Z]+$/.test(word)));
});

test('room exhausts every word before repeats; deck refill avoids adjacent repeats', () => {
  const room = {word:''};
  for (let cycle=0; cycle<3; cycle++) {
    const seen = new Set();
    for (let i=0; i<WORDS.length; i++) {
      const word = nextWord(room);
      assert.notEqual(word, room.word);
      assert.ok(!seen.has(word));
      seen.add(word);
      room.word = word;
    }
    assert.deepEqual([...seen].sort(), [...WORDS].sort());
  }
});

test('separate rooms have independent decks', () => {
  const a={word:''}, b={word:''};
  a.word=nextWord(a);
  b.word=nextWord(b);
  const remaining=[...b.wordDeck];
  nextWord(a);
  assert.deepEqual(b.wordDeck,remaining);
});
