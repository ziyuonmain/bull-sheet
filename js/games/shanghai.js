// Shanghai Game Engine (1-8 Players, Instant Shanghai Win Detection)
export class ShanghaiGame {
  constructor(config = {}) {
    this.maxRounds = config.rounds || 7; // Usually 1 to 7 (or 1 to 20)
    this.currentRound = 1;

    this.players = (config.players || [{ name: 'Player 1' }, { name: 'Player 2' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      score: 0,
      roundScores: {},
      totalDarts: 0
    }));

    this.activePlayerIdx = 0;
    this.turnDarts = [];
    this.history = [];
    this.isMatchOver = false;
    this.winner = null;
    this.instantShanghai = false;
  }

  getActivePlayer() {
    return this.players[this.activePlayerIdx];
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    const player = this.getActivePlayer();
    const target = this.currentRound;
    let hit = false;
    let points = 0;

    if (dart.number === target) {
      hit = true;
      points = dart.score;
    }

    this.history.push({
      playerIdx: this.activePlayerIdx,
      round: this.currentRound,
      dart,
      prevScore: player.score
    });

    player.totalDarts++;
    this.turnDarts.push({ ...dart, isTargetHit: hit });

    if (hit) {
      player.score += points;
    }

    if (this.turnDarts.length === 3) {
      // Check for Instant Shanghai: Hit S, D, and T of active round number
      const targetHits = this.turnDarts.filter(d => d.isTargetHit);
      const hasSingle = targetHits.some(d => d.mult === 1);
      const hasDouble = targetHits.some(d => d.mult === 2);
      const hasTreble = targetHits.some(d => d.mult === 3);

      if (hasSingle && hasDouble && hasTreble) {
        this.isMatchOver = true;
        this.instantShanghai = true;
        this.winner = player;
        return {
          type: 'match_win',
          instantShanghai: true,
          winner: player,
          players: this.players
        };
      }

      player.roundScores[this.currentRound] = player.score;
      const res = {
        type: 'turn_end',
        player,
        round: this.currentRound,
        score: player.score
      };

      this.finishTurn();
      return res;
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      dartsLeft: 3 - this.turnDarts.length,
      hit
    };
  }

  finishTurn() {
    this.turnDarts = [];
    this.activePlayerIdx++;

    if (this.activePlayerIdx >= this.players.length) {
      this.activePlayerIdx = 0;
      this.currentRound++;

      if (this.currentRound > this.maxRounds) {
        this.isMatchOver = true;
        let highest = -Infinity;
        let winP = this.players[0];
        this.players.forEach(p => {
          if (p.score > highest) {
            highest = p.score;
            winP = p;
          }
        });
        this.winner = winP;
        return {
          type: 'match_win',
          winner: winP,
          players: this.players
        };
      }
    }
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    this.activePlayerIdx = last.playerIdx;
    this.currentRound = last.round;
    const player = this.getActivePlayer();

    player.score = last.prevScore;
    player.totalDarts--;
    this.turnDarts.pop();

    this.isMatchOver = false;
    this.winner = null;
    this.instantShanghai = false;

    return {
      player,
      score: player.score,
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
