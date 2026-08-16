// Split Score (Halve-It) Game Engine (1-8 Players)
export class SplitScoreGame {
  constructor(config = {}) {
    this.rounds = [
      { id: '15', label: '15', targetType: 'num', value: 15 },
      { id: '16', label: '16', targetType: 'num', value: 16 },
      { id: 'doubles', label: 'Any Double', targetType: 'double' },
      { id: '17', label: '17', targetType: 'num', value: 17 },
      { id: '18', label: '18', targetType: 'num', value: 18 },
      { id: 'trebles', label: 'Any Treble', targetType: 'treble' },
      { id: '19', label: '19', targetType: 'num', value: 19 },
      { id: '20', label: '20', targetType: 'num', value: 20 },
      { id: 'bull', label: 'Bullseye', targetType: 'bull' }
    ];

    this.startScore = config.startScore || 40;
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

  getCurrentRound() {
    return this.rounds[this.currentRoundIdx];
  }

  getActivePlayer() {
    return this.players[this.activePlayerIdx];
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    const player = this.getActivePlayer();
    const round = this.getCurrentRound();
    let hit = false;
    let points = 0;

    if (round.targetType === 'num') {
      if (dart.number === round.value) {
        hit = true;
        points = dart.score;
      }
    } else if (round.targetType === 'double') {
      if (dart.mult === 2 || (dart.number === 25 && dart.mult === 2)) {
        hit = true;
        points = dart.score;
      }
    } else if (round.targetType === 'treble') {
      if (dart.mult === 3) {
        hit = true;
        points = dart.score;
      }
    } else if (round.targetType === 'bull') {
      if (dart.number === 25) {
        hit = true;
        points = dart.score;
      }
    }

    this.history.push({
      playerIdx: this.activePlayerIdx,
      roundIdx: this.currentRoundIdx,
      dart,
      prevScore: player.score,
      prevHits: player.hitsThisRound
    });

    player.totalDarts++;
    this.turnDarts.push(dart);

    if (hit) {
      player.hitsThisRound++;
      player.score += points;
    }

    if (this.turnDarts.length === 3) {
      let halved = false;
      if (player.hitsThisRound === 0) {
        player.score = Math.floor(player.score / 2);
        halved = true;
      }

      player.roundScores.push(player.score);
      const res = {
        type: 'turn_end',
        player,
        halved,
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
    const player = this.getActivePlayer();
    player.hitsThisRound = 0;
    this.turnDarts = [];

    // Next player or next round
    this.activePlayerIdx++;
    if (this.activePlayerIdx >= this.players.length) {
      this.activePlayerIdx = 0;
      this.currentRoundIdx++;

      if (this.currentRoundIdx >= this.rounds.length) {
        // Game complete, find highest score
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
    this.currentRoundIdx = last.roundIdx;
    const player = this.getActivePlayer();

    player.score = last.prevScore;
    player.hitsThisRound = last.prevHits;
    player.totalDarts--;
    this.turnDarts.pop();

    this.isMatchOver = false;
    this.winner = null;

    return {
      player,
      score: player.score,
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
