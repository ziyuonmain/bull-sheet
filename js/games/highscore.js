// Highscore Game Engine with Explicit Visit Completion & Clean Round End
export class HighscoreGame {
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
      turns: [],
      highTurn: 0,
      count180: 0,
      count140: 0,
      count100: 0,
      totalDarts: 0
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

  getNextPlayer() {
    const nextIdx = (this.activePlayerIdx + 1) % this.players.length;
    return this.players[nextIdx];
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    if (this.turnDarts.length >= 3) {
      const fin = this.finishTurn();
      if (fin && fin.type === 'match_win') return fin;
    }

    // If 3 darts were already thrown and user enters a new dart, auto-finish turn first
    if (this.turnDarts.length >= 3) {
      const finishRes = this.finishTurn();
      if (finishRes && finishRes.type === 'match_win') {
        return finishRes;
      }
    }

    const player = this.getActivePlayer();
    const scoreVal = Number(dart.score) || (Number(dart.number) * (Number(dart.mult) || 1));

    this.history.push({
      playerIdx: this.activePlayerIdx,
      round: this.currentRound,
      dart,
      scoreVal,
      prevScore: player.score,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({ score: p.score, roundScores: [...p.roundScores], totalDarts: p.totalDarts }))
    });

    player.score += scoreVal;
    player.totalDarts++;
    this.turnDarts.push(dart);

    if (this.turnDarts.length === 3) {
      const turnScore = this.turnDarts.reduce((a, d) => a + (d.score || 0), 0);
      player.roundScores.push(turnScore);
      player.turns.push(turnScore);
      if (turnScore > player.highTurn) player.highTurn = turnScore;
      if (turnScore === 180) player.count180++;
      else if (turnScore >= 140) player.count140++;
      else if (turnScore >= 100) player.count100++;

      const isLastRound = this.currentRound >= this.maxRounds && this.activePlayerIdx === this.players.length - 1;

      return {
        type: 'visit_complete',
        player,
        dart,
        lastDart: dart,
        turnScore,
        score: player.score,
        isLastRound,
        nextPlayer: this.getNextPlayer()
      };
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      score: player.score,
      dartsLeft: 3 - this.turnDarts.length
    };
  }

  finishTurn() {
    if (this.turnDarts.length === 0 && !this.isMatchOver) return null;

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

    return {
      type: 'turn_advanced',
      activePlayer: this.getActivePlayer(),
      currentRound: this.currentRound
    };
  }

  getPlayerAvg(player) {
    if (!player || player.totalDarts === 0) return '0.00';
    return ((player.score / player.totalDarts) * 3).toFixed(2);
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
