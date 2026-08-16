// Around the Clock Game Engine with Deep Multi-Player Undo
export class AroundClockGame {
  constructor(config = {}) {
    this.players = (config.players || [{ name: 'Player 1' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      currentTarget: 1, // 1 through 20, then 25 (Bull)
      totalDarts: 0,
      history: []
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
    const dartNum = Number(dart.number);
    const dartMult = Number(dart.mult) || 1;

    let hit = false;
    let leap = 0;

    if (target === 25) {
      if (dartNum === 25) {
        hit = true;
        leap = 1;
      }
    } else {
      if (dartNum === target) {
        hit = true;
        leap = dartMult; // Double leap 2, Treble leap 3
      }
    }

    this.history.push({
      playerIdx: this.activePlayerIdx,
      dart,
      hit,
      prevTarget: player.currentTarget,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({ currentTarget: p.currentTarget, totalDarts: p.totalDarts }))
    });

    player.totalDarts++;
    this.turnDarts.push({ ...dart, hit });

    if (hit) {
      const nextTarget = player.currentTarget + leap;
      if (nextTarget > 20 && player.currentTarget <= 20) {
        player.currentTarget = 25; // Bullseye
      } else if (player.currentTarget === 25) {
        // Match Won!
        this.isMatchOver = true;
        this.winner = player;
        return {
          type: 'match_win',
          winner: player,
          players: this.players
        };
      } else {
        player.currentTarget = nextTarget;
      }
    }

    if (this.turnDarts.length === 3) {
      const res = {
        type: 'turn_end',
        player,
        currentTarget: player.currentTarget
      };
      this.finishTurn();
      return res;
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      hit,
      currentTarget: player.currentTarget,
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
    if (last.playersSnapshot) {
      this.players.forEach((p, idx) => {
        const snap = last.playersSnapshot[idx];
        if (snap) {
          p.currentTarget = snap.currentTarget;
          p.totalDarts = snap.totalDarts;
        }
      });
    }

    this.turnDarts = last.turnDartsSnapshot || [];
    this.isMatchOver = false;
    this.winner = null;

    return {
      player: this.getActivePlayer(),
      currentTarget: this.getActivePlayer().currentTarget,
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
