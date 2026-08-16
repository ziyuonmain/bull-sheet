// Bob's 27 World Standard Double Practice Drill for BullSheet
// Start at 27 points. 21 rounds: D1 to D20 + Bullseye.
// Hit double: add double value per hit. Miss all 3: subtract double value once. Drops <= 0: Knockout / Game Over!

export class Bobs27Game {
  constructor(options = {}) {
    const playersList = Array.isArray(options) ? options : (options.players || []);
    this.mode = 'bobs27';
    this.totalRounds = 21; // D1 through D20 (1-20), plus Bullseye (21)
    this.currentRound = options.currentRound || 1;
    this.activePlayerIndex = options.activePlayerIndex || 0;
    this.turnDarts = options.turnDarts || [];
    this.isMatchOver = !!options.isMatchOver;
    this.winner = options.winner || null;
    this.history = [];

    this.players = playersList.map(p => ({
      id: p.id || Math.random().toString(36).substring(2, 9),
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      score: p.score !== undefined ? p.score : 27,
      startingScore: 27,
      isEliminated: !!p.isEliminated,
      eliminatedRound: p.eliminatedRound || null,
      hitsThisRound: p.hitsThisRound || 0,
      roundPoints: p.roundPoints || 0,
      totalDoublesHit: p.totalDoublesHit || 0,
      totalDartsThrown: p.totalDartsThrown || 0,
      turns: p.turns || []
    }));

    if (this.players.length === 0) {
      this.players = [{
        id: 'p1',
        name: 'Player 1',
        isBot: false,
        score: 27,
        startingScore: 27,
        isEliminated: false,
        eliminatedRound: null,
        hitsThisRound: 0,
        roundPoints: 0,
        totalDoublesHit: 0,
        totalDartsThrown: 0,
        turns: []
      }];
    }
  }

  getTargetForRound(roundNum) {
    const r = Math.max(1, Math.min(21, roundNum));
    if (r >= 1 && r <= 20) {
      return { number: r, mult: 2, label: `D${r}`, value: r * 2 };
    }
    return { number: 25, mult: 2, label: 'Bull', value: 50 };
  }

  getCurrentTarget() {
    return this.getTargetForRound(this.currentRound);
  }

  getActivePlayer() {
    return this.players[this.activePlayerIndex];
  }

  getNextPlayer() {
    if (this.players.length <= 1) return this.getActivePlayer();
    let nextIdx = (this.activePlayerIndex + 1) % this.players.length;
    // Find next non-eliminated player if any
    for (let i = 0; i < this.players.length; i++) {
      const p = this.players[nextIdx];
      if (!p.isEliminated) return p;
      nextIdx = (nextIdx + 1) % this.players.length;
    }
    return this.players[nextIdx];
  }

  isDartTargetHit(dart, target) {
    if (!dart || dart.number === 0) return false;
    if (target.number === 25) {
      return (dart.number === 25 && dart.mult === 2) || (dart.score === 50) || dart.label === 'Bull' || dart.label === 'BULL';
    }
    return Number(dart.number) === Number(target.number) && Number(dart.mult) === 2;
  }

  saveSnapshot() {
    return {
      currentRound: this.currentRound,
      activePlayerIndex: this.activePlayerIndex,
      turnDarts: JSON.parse(JSON.stringify(this.turnDarts)),
      isMatchOver: this.isMatchOver,
      winner: this.winner ? { ...this.winner } : null,
      players: JSON.parse(JSON.stringify(this.players))
    };
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    // Auto-advance if already thrown 3 darts
    if (this.turnDarts.length >= 3) {
      const adv = this.finishTurn();
      if (adv && adv.type === 'match_win') return adv;
    }

    this.history.push(this.saveSnapshot());

    const player = this.getActivePlayer();
    const target = this.getCurrentTarget();
    const isHit = this.isDartTargetHit(dart, target);

    let mult = dart.mult !== undefined ? dart.mult : (dart.label?.startsWith('D') ? 2 : 1);
    let num = dart.number !== undefined ? dart.number : 0;
    let label = dart.label || (num === 0 ? 'Miss' : (mult === 2 ? `D${num}` : (mult === 3 ? `T${num}` : `S${num}`)));

    const dartObj = {
      number: num,
      mult: mult,
      score: dart.score !== undefined ? dart.score : (num * mult),
      label: label,
      isHit
    };

    this.turnDarts.push(dartObj);
    player.totalDartsThrown++;

    if (isHit) {
      player.hitsThisRound++;
      player.roundPoints += target.value;
      player.totalDoublesHit++;
    }

    // 3rd Dart thrown -> Evaluate Bob's 27 round penalty / reward
    if (this.turnDarts.length === 3) {
      const delta = player.hitsThisRound > 0 ? player.roundPoints : -target.value;
      player.score += delta;
      player.turns.push(delta);

      // Check for knockout / elimination (score drops <= 0)
      if (player.score <= 0) {
        player.isEliminated = true;
        player.eliminatedRound = this.currentRound;
      }

      const matchEnded = this.checkMatchCompletion();

      const turnResult = {
        type: matchEnded ? 'match_win' : 'visit_complete',
        player,
        dart: dartObj,
        lastDart: dartObj,
        hits: player.hitsThisRound,
        delta,
        turnScore: delta > 0 ? delta : 0,
        remaining: player.score,
        isEliminated: player.isEliminated,
        isMatchOver: this.isMatchOver,
        winner: this.winner,
        nextPlayer: this.getNextPlayer()
      };

      return turnResult;
    }

    return {
      type: 'dart_recorded',
      player,
      dart: dartObj,
      hitsThisRound: player.hitsThisRound,
      remaining: player.score
    };
  }

  finishTurn() {
    if (this.isMatchOver) {
      return { type: 'match_win', winner: this.winner, players: this.players };
    }

    this.turnDarts = [];
    const player = this.getActivePlayer();
    if (player) {
      player.hitsThisRound = 0;
      player.roundPoints = 0;
    }

    // Advance to next active player
    let nextIdx = this.activePlayerIndex + 1;

    if (nextIdx >= this.players.length) {
      nextIdx = 0;
      this.currentRound++;
    }

    // If multiplayer, skip already eliminated players
    const activeSurvivors = this.players.filter(p => !p.isEliminated);
    if (activeSurvivors.length > 0 && activeSurvivors.length < this.players.length) {
      let attempts = 0;
      while (this.players[nextIdx].isEliminated && attempts < this.players.length) {
        nextIdx++;
        if (nextIdx >= this.players.length) {
          nextIdx = 0;
          this.currentRound++;
        }
        attempts++;
      }
    }

    this.activePlayerIndex = nextIdx;

    if (this.currentRound > this.totalRounds || this.checkMatchCompletion()) {
      this.finishMatch();
      return {
        type: 'match_win',
        winner: this.winner,
        players: this.players
      };
    }

    return {
      type: 'turn_advanced',
      activePlayer: this.getActivePlayer(),
      currentRound: this.currentRound,
      currentTarget: this.getCurrentTarget()
    };
  }

  advanceTurn() {
    return this.finishTurn();
  }

  checkMatchCompletion() {
    const activeSurvivors = this.players.filter(p => !p.isEliminated);

    // Solo game over on knockout
    if (this.players.length === 1 && activeSurvivors.length === 0) {
      this.finishMatch();
      return true;
    }

    // Multiplayer: all knocked out
    if (activeSurvivors.length === 0) {
      this.finishMatch();
      return true;
    }

    // Reached end of 21 rounds
    if (this.currentRound > this.totalRounds) {
      this.finishMatch();
      return true;
    }

    return false;
  }

  finishMatch() {
    this.isMatchOver = true;
    // Winner is highest final score among survivors, or player who survived longest
    const sorted = [...this.players].sort((a, b) => {
      if (a.isEliminated !== b.isEliminated) {
        return a.isEliminated ? 1 : -1;
      }
      if (a.isEliminated && b.isEliminated) {
        return (b.eliminatedRound || 0) - (a.eliminatedRound || 0);
      }
      return b.score - a.score;
    });
    this.winner = sorted[0] || this.players[0];
  }

  undo() {
    if (this.history.length === 0) return null;
    const prev = this.history.pop();
    this.currentRound = prev.currentRound;
    this.activePlayerIndex = prev.activePlayerIndex;
    this.turnDarts = prev.turnDarts;
    this.isMatchOver = prev.isMatchOver;
    this.winner = prev.winner;
    this.players = prev.players;
    return { type: 'undo', player: this.getActivePlayer() };
  }
}
