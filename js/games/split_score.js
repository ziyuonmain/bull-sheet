// Split Score (Halve-It) Game Engine with Explicit Visit Completion, Robust Hit Matching, and Deep Undo
export class SplitScoreGame {
  constructor(config = {}) {
    this.startScore = config.startScore || 40;
    
    // Generate or use custom rounds list
    if (config.roundsList && config.roundsList.length > 0) {
      this.rounds = config.roundsList;
    } else if (config.orderType === 'classic') {
      this.rounds = [
        { id: '15', label: '15', targetType: 'num', value: 15 },
        { id: '16', label: '16', targetType: 'num', value: 16 },
        { id: 'doubles', label: 'ANY DOUBLE', targetType: 'double' },
        { id: '17', label: '17', targetType: 'num', value: 17 },
        { id: '18', label: '18', targetType: 'num', value: 18 },
        { id: 'trebles', label: 'ANY TREBLE', targetType: 'treble' },
        { id: '19', label: '19', targetType: 'num', value: 19 },
        { id: '20', label: '20', targetType: 'num', value: 20 },
        { id: 'bull', label: 'BULLSEYE', targetType: 'bull', value: 25 }
      ];
    } else {
      this.rounds = this.generateRandomRounds(config.roundCount || 8);
    }

    this.currentRoundIdx = 0;

    this.players = (config.players || [{ name: 'Player 1' }, { name: 'Player 2' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      score: this.startScore,
      roundScores: [],
      hitsThisRound: 0,
      totalDarts: 0
    }));

    this.activePlayerIdx = 0;
    this.turnDarts = [];
    this.history = [];
    this.isMatchOver = false;
    this.winner = null;
  }

  generateRandomRounds(count = 8) {
    const nums = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const shuffledNums = [...nums].sort(() => 0.5 - Math.random());
    const generated = [];

    const numPicks = Math.max(4, count - 3);
    for (let i = 0; i < numPicks; i++) {
      const n = shuffledNums[i];
      generated.push({ id: `num_${n}`, label: `${n}`, targetType: 'num', value: n });
    }

    generated.splice(Math.floor(generated.length / 2), 0, { id: 'doubles', label: 'ANY DOUBLE', targetType: 'double' });
    generated.splice(generated.length - 1, 0, { id: 'trebles', label: 'ANY TREBLE', targetType: 'treble' });
    generated.push({ id: 'bull', label: 'BULLSEYE', targetType: 'bull', value: 25 });

    return generated;
  }

  getCurrentRound() {
    return this.rounds[this.currentRoundIdx] || this.rounds[this.rounds.length - 1];
  }

  getActivePlayer() {
    return this.players[this.activePlayerIdx];
  }

  getNextPlayer() {
    const nextIdx = (this.activePlayerIdx + 1) % this.players.length;
    return this.players[nextIdx];
  }

  isDartTargetHit(dart, round) {
    if (!dart || !round) return false;

    const dartNum = Number(dart.number);
    const dartMult = Number(dart.mult) || 1;
    const roundVal = Number(round.value);

    if (round.targetType === 'num') {
      return dartNum === roundVal && dartNum > 0;
    }
    if (round.targetType === 'double') {
      return dartMult === 2 || (dartNum === 25 && dartMult === 2);
    }
    if (round.targetType === 'treble') {
      return dartMult === 3;
    }
    if (round.targetType === 'bull') {
      return dartNum === 25;
    }
    return false;
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    if (this.turnDarts.length >= 3) {
      const fin = this.finishTurn();
      if (fin && fin.type === 'match_win') return fin;
    }

    // Auto-advance if previous 3 darts were complete and new throw arrives
    if (this.turnDarts.length >= 3) {
      const finishRes = this.finishTurn();
      if (finishRes && finishRes.type === 'match_win') {
        return finishRes;
      }
    }

    const player = this.getActivePlayer();
    const round = this.getCurrentRound();
    const hit = this.isDartTargetHit(dart, round);
    const points = hit ? (Number(dart.score) || (Number(dart.number) * (Number(dart.mult) || 1))) : 0;

    this.history.push({
      playerIdx: this.activePlayerIdx,
      roundIdx: this.currentRoundIdx,
      dart: { ...dart },
      isHit: hit,
      pointsScored: points,
      prevScore: player.score,
      prevHits: player.hitsThisRound,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({ score: p.score, hitsThisRound: p.hitsThisRound, totalDarts: p.totalDarts, roundScores: [...p.roundScores] }))
    });

    player.totalDarts++;
    this.turnDarts.push({ ...dart, isHit: hit, pointsScored: points });

    if (hit) {
      player.hitsThisRound++;
      player.score += points;
    }

    if (this.turnDarts.length === 3) {
      let halved = false;
      const turnScore = this.turnDarts.reduce((sum, d) => sum + (d.pointsScored || 0), 0);

      if (player.hitsThisRound === 0) {
        player.score = Math.floor(player.score / 2);
        halved = true;
      }

      player.roundScores[this.currentRoundIdx] = player.score;
      const isLastRound = this.currentRoundIdx >= this.rounds.length - 1 && this.activePlayerIdx === this.players.length - 1;

      return {
        type: 'visit_complete',
        player,
        dart,
        lastDart: dart,
        halved,
        turnScore,
        roundHits: player.hitsThisRound,
        score: player.score,
        isLastRound,
        completedRound: round,
        nextPlayer: this.getNextPlayer()
      };
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      hit,
      points,
      dartsLeft: 3 - this.turnDarts.length,
      currentHitsThisRound: player.hitsThisRound,
      currentScore: player.score
    };
  }

  finishTurn() {
    if (this.turnDarts.length === 0 && !this.isMatchOver) return null;

    const player = this.getActivePlayer();
    player.hitsThisRound = 0;
    this.turnDarts = [];

    this.activePlayerIdx++;
    if (this.activePlayerIdx >= this.players.length) {
      this.activePlayerIdx = 0;
      this.currentRoundIdx++;

      if (this.currentRoundIdx >= this.rounds.length) {
        this.isMatchOver = true;
        this.currentRoundIdx = this.rounds.length - 1;
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
      currentRound: this.getCurrentRound()
    };
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    this.activePlayerIdx = last.playerIdx;
    this.currentRoundIdx = last.roundIdx;

    if (last.playersSnapshot) {
      this.players.forEach((p, idx) => {
        const snap = last.playersSnapshot[idx];
        if (snap) {
          p.score = snap.score;
          p.hitsThisRound = snap.hitsThisRound;
          p.totalDarts = snap.totalDarts;
          p.roundScores = [...snap.roundScores];
        }
      });
    } else {
      const player = this.getActivePlayer();
      player.score = last.prevScore;
      player.hitsThisRound = last.prevHits;
    }

    this.turnDarts = last.turnDartsSnapshot || [];
    this.isMatchOver = false;
    this.winner = null;

    return {
      player: this.getActivePlayer(),
      score: this.getActivePlayer().score,
      dartsLeft: 3 - this.turnDarts.length,
      currentRound: this.getCurrentRound()
    };
  }
}
