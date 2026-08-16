// Shanghai Game Engine with Clean Match-Win Propagation and Instant Win Support
export class ShanghaiGame {
  constructor(config = {}) {
    this.maxRounds = config.rounds || 7;
    this.currentRound = 1;

    this.players = (config.players || [{ name: 'Player 1' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      score: 0,
      roundScores: [],
      totalDarts: 0
    }));

    this.activePlayerIdx = 0;
    this.turnDarts = [];
    this.history = [];
    this.isMatchOver = false;
    this.winner = null;
  }

  getNextPlayer() {
    const nextIdx = (this.activePlayerIdx + 1) % this.players.length;
    return this.players[nextIdx];
  }

  getActivePlayer() {
    return this.players[this.activePlayerIdx];
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    if (this.turnDarts.length >= 3) {
      const fin = this.finishTurn();
      if (fin && fin.type === 'match_win') return fin;
    }

    const player = this.getActivePlayer();
    const target = this.currentRound;
    const dartNum = Number(dart.number);
    const dartMult = Number(dart.mult) || 1;

    let points = 0;
    if (dartNum === target) {
      points = dartNum * dartMult;
    }

    this.history.push({
      playerIdx: this.activePlayerIdx,
      round: this.currentRound,
      dart,
      points,
      prevScore: player.score,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({ score: p.score, roundScores: [...p.roundScores], totalDarts: p.totalDarts }))
    });

    player.score += points;
    player.totalDarts++;
    this.turnDarts.push({ ...dart, pointsScored: points });

    // Shanghai Instant Win Check: Single, Double, Treble of the target in the same visit
    const targetDarts = this.turnDarts.filter(d => Number(d.number) === target);
    const hasSingle = targetDarts.some(d => Number(d.mult) === 1);
    const hasDouble = targetDarts.some(d => Number(d.mult) === 2);
    const hasTreble = targetDarts.some(d => Number(d.mult) === 3);

    if (hasSingle && hasDouble && hasTreble) {
      this.isMatchOver = true;
        this.currentRound = this.maxRounds;
      this.winner = player;
      return {
        type: 'match_win',
        winner: player,
        shanghaiWin: true,
        players: this.players
      };
    }

    if (this.turnDarts.length === 3) {
      const turnScore = this.turnDarts.reduce((a, d) => a + (d.pointsScored || 0), 0);
      player.roundScores.push(turnScore);

      const finishRes = this.finishTurn();
      if (finishRes && finishRes.type === 'match_win') {
        return finishRes;
      }

      return {
        type: 'visit_complete',
        player,
        turnScore,
        score: player.score
      };
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      points,
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
          p.roundScores = [...snap.roundScores];
          p.totalDarts = snap.totalDarts;
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
