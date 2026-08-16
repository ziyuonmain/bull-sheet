// Cricket & Cutthroat Cricket Game Engine (1-8 Players, Live Marks & MPR)
export class CricketGame {
  constructor(config = {}) {
    this.mode = config.mode || 'standard'; // 'standard' or 'cutthroat'
    this.targets = [20, 19, 18, 17, 16, 15, 25]; // 25 = Bull
    
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

  getActivePlayer() {
    return this.players[this.activePlayerIdx];
  }

  isTargetClosedForAll(target) {
    return this.players.every(p => p.marks[target] >= 3);
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    const player = this.getActivePlayer();
    const target = dart.number === 25 ? 25 : dart.number;
    const isCricketTarget = this.targets.includes(target);
    const hitMult = dart.mult || 1;

    let marksScored = 0;
    let pointsScored = 0;

    // Deep clone state for undo
    const stateSnapshot = {
      playerIdx: this.activePlayerIdx,
      dart,
      scores: this.players.map(p => p.score),
      marks: this.players.map(p => ({ ...p.marks }))
    };
    this.history.push(stateSnapshot);

    player.totalDarts++;
    this.turnDarts.push(dart);

    if (isCricketTarget) {
      const currentMarks = player.marks[target];
      const neededToClose = Math.max(0, 3 - currentMarks);

      if (hitMult <= neededToClose) {
        player.marks[target] += hitMult;
        marksScored = hitMult;
      } else {
        // Closed + Over-hitting for points
        player.marks[target] = 3;
        marksScored = neededToClose;
        const extraHits = hitMult - neededToClose;

        const valPerHit = target === 25 ? 25 : target;
        const addedScore = extraHits * valPerHit;

        if (this.mode === 'standard') {
          // Add points to current player if any opponent hasn't closed
          if (!this.isTargetClosedForAll(target)) {
            player.score += addedScore;
            pointsScored = addedScore;
          }
        } else {
          // Cutthroat: Add points to all opponents who have not closed it
          this.players.forEach((opp, i) => {
            if (i !== this.activePlayerIdx && opp.marks[target] < 3) {
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
        // Cutthroat: Lowest score wins
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

    // Turn complete after 3 darts
    if (this.turnDarts.length === 3) {
      player.roundsPlayed++;
      const result = {
        type: 'turn_end',
        player,
        marksScored,
        pointsScored
      };
      this.finishTurn();
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
    });

    const active = this.getActivePlayer();
    active.totalDarts--;
    this.turnDarts.pop();

    this.isMatchOver = false;
    this.winner = null;

    return {
      player: active,
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
