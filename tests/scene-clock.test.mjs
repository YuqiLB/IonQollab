import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneClock } from '../js/scene-clock.js';

test('pending attack cannot reach the reveal, even after skipping', () => {
  const clock = new SceneClock(22000, 12500);
  assert.equal(clock.tick(21000, false), 12500);
  assert.equal(clock.skip(false), 12500);
  assert.equal(clock.tick(100000, false), 12500);
  assert.equal(clock.tick(0, true), 22000);
});

test('verified arrival resumes normally when skip was not requested', () => {
  const clock = new SceneClock(22000, 12500);
  clock.tick(15000, false);
  assert.equal(clock.tick(500, true), 13000);
  assert.equal(clock.tick(100000, true), 22000);
});

test('pause holds elapsed time; replay clears a pending skip', () => {
  const clock = new SceneClock(22000, 12500);
  clock.tick(5000, false);
  clock.paused = true;
  assert.equal(clock.tick(15000, true), 5000);
  clock.skip(false);
  clock.replay();
  assert.equal(clock.elapsed, 0);
  assert.equal(clock.paused, false);
  assert.equal(clock.skipRequested, false);
  assert.equal(clock.tick(500, true), 500);
});

test('negative deltas never rewind and ordinary scenes stop at their end', () => {
  const clock = new SceneClock(13000);
  clock.tick(5000);
  assert.equal(clock.tick(-1000), 5000);
  assert.equal(clock.tick(50000), 13000);
});
