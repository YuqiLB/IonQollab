// A presentation clock cannot advance beyond an unverified-result gate.
export class SceneClock {
  constructor(duration, gate = duration) {
    this.duration = duration; this.gate = gate; this.elapsed = 0;
    this.paused = false; this.skipRequested = false;
  }
  tick(delta, unlocked = true) {
    if (this.paused) return this.elapsed;
    const limit = unlocked ? this.duration : this.gate;
    this.elapsed = Math.min(limit, this.skipRequested ? this.duration : this.elapsed + Math.max(0, delta));
    return this.elapsed;
  }
  skip(unlocked = true) { this.skipRequested = true; this.paused = false; return this.tick(0, unlocked); }
  replay() { this.elapsed = 0; this.paused = false; this.skipRequested = false; }
}
