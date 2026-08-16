// Highscore Game Engine with Clean Match-Win Propagation, Clamped Round End, and Full Undo
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

  recordDart(dart) {
    if (this.isMatchOver) return null;

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

      const finishRes = this.finishTurn();
      if (finishRes && finishRes.type === 'match_win') {
        return finishRes;
      }

      return {
        type: 'turn_end',
        player,
        turnScore,
        score: player.score
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

  recordTurnScore(turnScore) {
    if (this.isMatchOver) return null;
    const player = this.getActivePlayer();

    this.history.push({
      playerIdx: this.activePlayerIdx,
      round: this.currentRound,
      turnScore,
      prevScore: player.score,
      isFullTurn: true,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({ score: p.score, roundScores: [...p.roundScores], totalDarts: p.totalDarts }))
    });

    player.score += turnScore;
    player.totalDarts += 3;
    player.roundScores.push(turnScore);
    player.turns.push(turnScore);
    if (turnScore > player.highTurn) player.highTurn = turnScore;
    if (turnScore === 180) player.count180++;
    else if (turnScore >= 140) player.count140++;
    else if (turnScore >= 100) player.count100++;

    const finishRes = this.finishTurn();
    if (finishRes && finishRes.type === 'match_win') {
      return finishRes;
    }

    return {
      type: 'turn_end',
      player,
      turnScore,
      score: player.score
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
        this.currentRound = this.maxRounds; // Clamp to max rounds
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
