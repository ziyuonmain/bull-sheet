// Around the Clock Game Engine (1-8 Players, Standard & Doubles/Trebles Multiplier Advance)
export class AroundClockGame {
  constructor(config = {}) {
    this.allowMultipliers = config.allowMultipliers !== undefined ? config.allowMultipliers : true;

    this.players = (config.players || [{ name: 'Player 1' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      currentTarget: 1, // 1 to 20, 25 for Bull
      hits: 0,
      totalDarts: 0,
      isFinished: false
    }));

    this.activePlayerIdx = 0;
    this.turnDarts = [];
    this.history = [];
    this.isMatchOver = false;
    this.winner = null;
  }

  getActivePlayer() {
    return this.players[this.activePlayerIdx];
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    const player = this.getActivePlayer();
    const target = player.currentTarget;
    let hit = false;
    let advancedBy = 0;

    const snapshot = {
      playerIdx: this.activePlayerIdx,
      dart,
      prevTarget: player.currentTarget,
      prevHits: player.hits
    };
    this.history.push(snapshot);

    player.totalDarts++;
    this.turnDarts.push(dart);

    if (target <= 20) {
      if (dart.number === target) {
        hit = true;
        player.hits++;
        advancedBy = this.allowMultipliers ? Math.max(1, dart.mult || 1) : 1;
        player.currentTarget += advancedBy;
        if (player.currentTarget > 20) {
          player.currentTarget = 25; // Advance to Bull
        }
      }
    } else if (target === 25) {
      // Bullseye to win
      if (dart.number === 25) {
        hit = true;
        player.hits++;
        player.isFinished = true;
        this.isMatchOver = true;
        this.winner = player;

        return {
          type: 'match_win',
          winner: player,
          players: this.players
        };
      }
    }

    if (this.turnDarts.length === 3) {
      const res = {
        type: 'turn_end',
        player,
        nextTarget: player.currentTarget
      };
      this.finishTurn();
      return res;
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      hit,
      nextTarget: player.currentTarget,
      dartsLeft: 3 - this.turnDarts.length
    };
  }

  finishTurn() {
    this.turnDarts = [];
    this.activePlayerIdx = (this.activePlayerIdx + 1) % this.players.length;
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    this.activePlayerIdx = last.playerIdx;
    const player = this.getActivePlayer();

    player.currentTarget = last.prevTarget;
    player.hits = last.prevHits;
    player.totalDarts--;
    this.turnDarts.pop();

    this.isMatchOver = false;
    this.winner = null;

    return {
      player,
      target: player.currentTarget,
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
