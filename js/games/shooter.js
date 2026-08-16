// Shooter Game Engine with Clean Match-Win Propagation and Robust Undo
export class ShooterGame {
  constructor(config = {}) {
    this.maxRounds = config.rounds || 8;
    this.currentRound = 1;
    this.targets = this.generateTargets(this.maxRounds);

    this.players = (config.players || [{ name: 'Player 1' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      score: 0,
      totalHits: 0,
      roundScores: [],
      totalDarts: 0
    }));

    this.activePlayerIdx = 0;
    this.turnDarts = [];
    this.history = [];
    this.isMatchOver = false;
    this.winner = null;
  }

  generateTargets(rounds) {
    const nums = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const shuffled = [...nums].sort(() => 0.5 - Math.random());
    const list = shuffled.slice(0, Math.max(0, rounds - 1));
    list.push(25); // Last round Bullseye
    return list;
  }

  getCurrentTarget() {
    return this.targets[this.currentRound - 1] || 20;
  }

  getActivePlayer() {
    return this.players[this.activePlayerIdx];
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    const player = this.getActivePlayer();
    const target = this.getCurrentTarget();
    const dartNum = Number(dart.number);
    const dartMult = Number(dart.mult) || 1;

    let hitsScored = 0;
    if (dartNum === target) {
      hitsScored = dartMult;
    }

    this.history.push({
      playerIdx: this.activePlayerIdx,
      round: this.currentRound,
      dart,
      hitsScored,
      prevScore: player.score,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({ score: p.score, totalHits: p.totalHits, totalDarts: p.totalDarts, roundScores: [...p.roundScores] }))
    });

    player.score += hitsScored;
    player.totalHits += hitsScored;
    player.totalDarts++;
    this.turnDarts.push({ ...dart, hitsScored });

    if (this.turnDarts.length === 3) {
      const turnHits = this.turnDarts.reduce((a, d) => a + (d.hitsScored || 0), 0);
      player.roundScores.push(turnHits);

      const finishRes = this.finishTurn();
      if (finishRes && finishRes.type === 'match_win') {
        return finishRes;
      }

      return {
        type: 'turn_end',
        player,
        turnScore: turnHits,
        score: player.score
      };
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      hitsScored,
      score: player.score,
      dartsLeft: 3 - this.turnDarts.length
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
        this.currentRound = this.maxRounds;
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

    if (last.playersSnapshot) {
      this.players.forEach((p, idx) => {
        const snap = last.playersSnapshot[idx];
        if (snap) {
          p.score = snap.score;
          p.totalHits = snap.totalHits;
          p.totalDarts = snap.totalDarts;
          p.roundScores = [...snap.roundScores];
        }
      });
    }

    this.turnDarts = last.turnDartsSnapshot || [];
    this.isMatchOver = false;
    this.winner = null;

    return {
      player: this.getActivePlayer(),
      score: this.getActivePlayer().score,
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
