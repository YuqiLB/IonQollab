import test from 'node:test';
import assert from 'node:assert/strict';
import { typingDelay, readingGap } from '../js/story-pacing.js';

test('Alice has a readable minimum pause and longer messages take longer', () => {
  assert.equal(typingDelay('Hi.'),1300);
  assert(typingDelay('I saved you the quiet end of the garden and the better coffee.')>typingDelay('Hi.'));
});
test('long messages cannot make the demo wait without a bound', () => {
  assert.equal(typingDelay('word '.repeat(300)),2600);
  assert.equal(readingGap('word '.repeat(300)),1000);
});
