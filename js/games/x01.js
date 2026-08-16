// X01 Game Engine (Supports 1-8 players & Bots, Legs & Sets, In/Out Modes, Real-time Stats, and Robust Undo)
import { getCheckoutSuggestion } from '../components/checkout.js';

export class X01Game {
  constructor(config = {}) {
    this.startScore = config.startScore || 501;
    this.inMode = config.inMode || 'straight';
    this.outMode = config.outMode || 'double';
    this.legsToWin = config.legsToWin || 3;
    this.setsToWin = config.setsToWin || 1;
    this.legsPerSet = config.legsPerSet || 3;

    this.players = (config.players || [{ name: 'Player 1' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      score: this.startScore,
      legsWon: 0,
      setsWon: 0,
      hasDoubledIn: this.inMode === 'straight',
      totalDarts: 0,
      totalScoreScored: 0,
      highTurn: 0,
      turns: [],
      count180: 0,
      count140: 0,
      count100: 0,
      count60: 0,
      countBusts: 0,
      doublesHit: 0
    }));

    this.activePlayerIdx = 0;
    this.turnDarts = []; // [ { number, mult, score, label } ]
    this.history = [];   // Full undo stack
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
    const prevScore = player.score;
    const prevDoubledIn = player.hasDoubledIn;
    const dartNum = Number(dart.number);
    const dartMult = Number(dart.mult) || 1;
    const dartScore = Number(dart.score) || (dartNum * dartMult);

    let scoredVal = dartScore;

    if (!player.hasDoubledIn) {
      if (dartMult === 2 || (dartNum === 25 && dartMult === 2)) {
        player.hasDoubledIn = true;
      } else {
        scoredVal = 0;
      }
    }

    const remaining = player.score - scoredVal;
    let isBust = false;
    let isLegWin = false;

    if (this.outMode === 'double') {
      if (remaining < 0 || remaining === 1) {
        isBust = true;
      } else if (remaining === 0) {
        if (dartMult === 2 || (dartNum === 25 && dartMult === 2)) {
          isLegWin = true;
        } else {
          isBust = true;
        }
      }
    } else if (this.outMode === 'master') {
      if (remaining < 0 || remaining === 1) {
        isBust = true;
      } else if (remaining === 0) {
        if (dartMult >= 2) {
          isLegWin = true;
        } else {
          isBust = true;
        }
      }
    } else { // Single out
      if (remaining < 0) {
        isBust = true;
      } else if (remaining === 0) {
        isLegWin = true;
      }
    }

    // Save snapshot for undo
    this.history.push({
      playerIdx: this.activePlayerIdx,
      dart: { ...dart, effectiveScore: scoredVal },
      prevScore,
      prevDoubledIn,
      isBust,
      isLegWin,
      turnDartsSnapshot: [...this.turnDarts],
      allPlayersSnapshot: this.players.map(p => ({
        score: p.score,
        legsWon: p.legsWon,
        setsWon: p.setsWon,
        totalScoreScored: p.totalScoreScored,
        totalDarts: p.totalDarts,
        turns: [...p.turns]
      }))
    });

    this.turnDarts.push(dart);
    player.totalDarts++;

    if (isBust) {
      player.countBusts++;
      player.score = this.getScoreAtStartOfTurn(player);
      const result = {
        type: 'bust',
        player,
        dart,
        turnDarts: [...this.turnDarts],
        remaining: player.score
      };
      return result;
    }

    if (isLegWin) {
      player.score = 0;
      player.doublesHit++;
      player.totalScoreScored += prevScore;
      return this.handleLegWin(player);
    }

    player.score = remaining;
    player.totalScoreScored += scoredVal;

    if (this.turnDarts.length === 3) {
      const turnScore = this.turnDarts.reduce((acc, d) => acc + (d.score || 0), 0);
      this.updateTurnStats(player, turnScore);
      return {
        type: 'visit_complete',
        player,
        dart,
        lastDart: dart,
        turnScore,
        remaining: player.score,
        nextPlayer: this.getNextPlayer()
      };
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      remaining: player.score,
      dartsLeft: 3 - this.turnDarts.length,
      checkout: this.getCheckout(player.score, 3 - this.turnDarts.length)
    };
  }

  recordTurnScore(turnScore) {
    if (this.isMatchOver) return null;
    const player = this.getActivePlayer();
    const prevScore = player.score;
    const remaining = player.score - turnScore;

    let isBust = false;
    let isLegWin = false;

    if (this.outMode === 'double') {
      if (remaining < 0 || remaining === 1) {
        isBust = true;
      } else if (remaining === 0) {
        isLegWin = true;
      }
    } else {
      if (remaining < 0) isBust = true;
      else if (remaining === 0) isLegWin = true;
    }

    this.history.push({
      playerIdx: this.activePlayerIdx,
      turnScore,
      prevScore,
      prevDoubledIn: player.hasDoubledIn,
      isBust,
      isLegWin,
      isFullTurn: true,
      turnDartsSnapshot: [...this.turnDarts],
      allPlayersSnapshot: this.players.map(p => ({
        score: p.score,
        legsWon: p.legsWon,
        setsWon: p.setsWon,
        totalScoreScored: p.totalScoreScored,
        totalDarts: p.totalDarts,
        turns: [...p.turns]
      }))
    });

    player.totalDarts += 3;

    if (isBust) {
      player.countBusts++;
      const result = {
        type: 'bust',
        player,
        turnScore,
        remaining: player.score
      };
      return result;
    }

    if (isLegWin) {
      player.score = 0;
      player.totalScoreScored += prevScore;
      player.doublesHit++;
      return this.handleLegWin(player);
    }

    player.score = remaining;
    player.totalScoreScored += turnScore;
    this.updateTurnStats(player, turnScore);

    const result = {
      type: 'visit_complete',
      player,
      turnScore,
      remaining: player.score
    };
    this.finishTurn();
    return result;
  }

  updateTurnStats(player, turnScore) {
    player.turns.push(turnScore);
    if (turnScore > player.highTurn) player.highTurn = turnScore;
    if (turnScore === 180) player.count180++;
    else if (turnScore >= 140) player.count140++;
    else if (turnScore >= 100) player.count100++;
    else if (turnScore >= 60) player.count60++;
  }

  getScoreAtStartOfTurn(player) {
    const priorDartsThisTurn = this.turnDarts.slice(0, -1);
    const scoredPriorDarts = priorDartsThisTurn.reduce((acc, d) => acc + (d.score || 0), 0);
    return player.score + scoredPriorDarts;
  }

  finishTurn() {
    this.turnDarts = [];
    this.activePlayerIdx = (this.activePlayerIdx + 1) % this.players.length;
  }

  handleLegWin(player) {
    player.legsWon++;
    let matchWon = false;

    if (player.legsWon >= this.legsPerSet) {
      player.setsWon++;
      player.legsWon = 0;
      if (player.setsWon >= this.setsToWin) {
        matchWon = true;
      }
    } else if (this.setsToWin === 1 && player.legsWon >= this.legsToWin) {
      matchWon = true;
    }

    if (matchWon) {
      this.isMatchOver = true;
      this.winner = player;
      return {
        type: 'match_win',
        winner: player,
        players: this.players
      };
    }

    // Reset scores for next leg
    this.players.forEach(p => {
      p.score = this.startScore;
      p.hasDoubledIn = this.inMode === 'straight';
    });
    this.turnDarts = [];

    return {
      type: 'leg_win',
      winner: player,
      players: this.players
    };
  }

  getCheckout(score, dartsLeft = 3) {
    return getCheckoutSuggestion(score, dartsLeft, this.outMode);
  }

  getPlayerAvg(player) {
    if (!player || player.totalDarts === 0) return '0.00';
    return ((player.totalScoreScored / player.totalDarts) * 3).toFixed(2);
  }

  getFirst9Avg(player) {
    if (!player || player.turns.length === 0) return '0.00';
    const first3Turns = player.turns.slice(0, 3);
    const sum = first3Turns.reduce((a, b) => a + b, 0);
    const darts = first3Turns.length * 3;
    return darts > 0 ? ((sum / darts) * 3).toFixed(2) : '0.00';
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    this.activePlayerIdx = last.playerIdx;
    
    // Restore all players state if leg/set had changed
    if (last.allPlayersSnapshot) {
      this.players.forEach((p, idx) => {
        const snap = last.allPlayersSnapshot[idx];
        if (snap) {
          p.score = snap.score;
          p.legsWon = snap.legsWon;
          p.setsWon = snap.setsWon;
          p.totalScoreScored = snap.totalScoreScored;
          p.totalDarts = snap.totalDarts;
          p.turns = [...snap.turns];
        }
      });
    }

    const player = this.getActivePlayer();
    player.score = last.prevScore;
    player.hasDoubledIn = last.prevDoubledIn;
    this.turnDarts = last.turnDartsSnapshot || [];

    this.isMatchOver = false;
    this.winner = null;

    return {
      player,
      score: player.score,
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
