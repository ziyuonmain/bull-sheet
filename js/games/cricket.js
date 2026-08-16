// Cricket & Cutthroat Cricket Game Engine with Deep Multi-Player Undo
export class CricketGame {
  constructor(config = {}) {
    this.mode = config.mode || 'standard';
    this.targets = [20, 19, 18, 17, 16, 15, 25];
    
    this.players = (config.players || [{ name: 'Player 1' }, { name: 'Player 2' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      score: 0,
      marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 },
      totalMarks: 0,
      roundsPlayed: 0,
      totalDarts: 0,
      turns: []
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

  isTargetClosedForAll(target) {
    return this.players.every(p => p.marks[target] >= 3);
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    if (this.turnDarts.length >= 3) {
      const fin = this.finishTurn();
      if (fin && fin.type === 'match_win') return fin;
    }

    const player = this.getActivePlayer();
    const targetNum = Number(dart.number) === 25 ? 25 : Number(dart.number);
    const isCricketTarget = this.targets.includes(targetNum);
    const hitMult = Number(dart.mult) || 1;

    let marksScored = 0;
    let pointsScored = 0;

    // Deep clone state for undo
    this.history.push({
      playerIdx: this.activePlayerIdx,
      dart: { ...dart },
      scores: this.players.map(p => p.score),
      marks: this.players.map(p => ({ ...p.marks })),
      totalMarks: this.players.map(p => p.totalMarks),
      totalDarts: this.players.map(p => p.totalDarts),
      turnDartsSnapshot: [...this.turnDarts]
    });

    player.totalDarts++;
    this.turnDarts.push(dart);

    if (isCricketTarget) {
      const currentMarks = player.marks[targetNum];
      const neededToClose = Math.max(0, 3 - currentMarks);

      if (hitMult <= neededToClose) {
        player.marks[targetNum] += hitMult;
        marksScored = hitMult;
      } else {
        player.marks[targetNum] = 3;
        marksScored = neededToClose;
        const extraHits = hitMult - neededToClose;

        const valPerHit = targetNum === 25 ? 25 : targetNum;
        const addedScore = extraHits * valPerHit;

        if (this.mode === 'standard') {
          if (!this.isTargetClosedForAll(targetNum)) {
            player.score += addedScore;
            pointsScored = addedScore;
          }
        } else {
          // Cutthroat
          this.players.forEach((opp, i) => {
            if (i !== this.activePlayerIdx && opp.marks[targetNum] < 3) {
              opp.score += addedScore;
            }
          });
        }
      }
      player.totalMarks += marksScored;
    }

    // Check Win Condition
    const allClosed = this.targets.every(t => player.marks[t] >= 3);
    let won = false;

    if (allClosed) {
      if (this.mode === 'standard') {
        const hasHighestScore = this.players.every(p => player.score >= p.score);
        if (hasHighestScore) won = true;
      } else {
        const hasLowestScore = this.players.every(p => player.score <= p.score);
        if (hasLowestScore) won = true;
      }
    }

    if (won) {
      this.isMatchOver = true;
      this.winner = player;
      return {
        type: 'match_win',
        winner: player,
        players: this.players
      };
    }

    if (this.turnDarts.length === 3) {
      player.roundsPlayed++;
      const result = {
        type: 'visit_complete',
        player,
        dart,
        lastDart: dart,
        marksScored,
        pointsScored
      };
      return result;
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      dartsLeft: 3 - this.turnDarts.length,
      marks: player.marks
    };
  }

  finishTurn() {
    this.turnDarts = [];
    this.activePlayerIdx = (this.activePlayerIdx + 1) % this.players.length;
  }

  getPlayerMPR(player) {
    if (!player || player.totalDarts === 0) return '0.00';
    return ((player.totalMarks / player.totalDarts) * 3).toFixed(2);
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    this.activePlayerIdx = last.playerIdx;
    this.players.forEach((p, i) => {
      p.score = last.scores[i];
      p.marks = { ...last.marks[i] };
      p.totalMarks = last.totalMarks[i];
      p.totalDarts = last.totalDarts[i];
    });

    this.turnDarts = last.turnDartsSnapshot || [];

    this.isMatchOver = false;
    this.winner = null;

    return {
      player: this.getActivePlayer(),
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
