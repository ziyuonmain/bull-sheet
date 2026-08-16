// Elimination (Knockout) Game Engine (2-8 Players, Beat the Leader Score or Lose a Life)
export class EliminationGame {
  constructor(config = {}) {
    this.startingLives = config.startingLives || 3;
    this.targetScoreToBeat = 0;
    this.targetSetByPlayer = null;

    this.players = (config.players || [{ name: 'Player 1' }, { name: 'Player 2' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      lives: this.startingLives,
      isEliminated: false,
      totalDarts: 0,
      roundsSurvived: 0,
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

  getAlivePlayers() {
    return this.players.filter(p => !p.isEliminated);
  }

  recordDart(dart) {
    if (this.isMatchOver) return null;

    const player = this.getActivePlayer();
    if (player.isEliminated) {
      this.finishTurn();
      return null;
    }

    const snapshot = {
      playerIdx: this.activePlayerIdx,
      dart,
      targetScoreToBeat: this.targetScoreToBeat,
      targetSetByPlayer: this.targetSetByPlayer,
      players: this.players.map(p => ({
        lives: p.lives,
        isEliminated: p.isEliminated,
        roundsSurvived: p.roundsSurvived
      }))
    };
    this.history.push(snapshot);

    player.totalDarts++;
    this.turnDarts.push(dart);

    if (this.turnDarts.length === 3) {
      const turnScore = this.turnDarts.reduce((acc, d) => acc + (d.score || 0), 0);
      player.turns.push(turnScore);

      let survived = true;
      let isFirstRound = this.targetScoreToBeat === 0 && !this.targetSetByPlayer;

      if (!isFirstRound) {
        if (turnScore < this.targetScoreToBeat) {
          survived = false;
          player.lives -= 1;
          if (player.lives <= 0) {
            player.lives = 0;
            player.isEliminated = true;
          }
        } else {
          player.roundsSurvived++;
          this.targetScoreToBeat = turnScore;
          this.targetSetByPlayer = player.name;
        }
      } else {
        // First player sets initial bar
        this.targetScoreToBeat = turnScore;
        this.targetSetByPlayer = player.name;
        player.roundsSurvived++;
      }

      // Check win condition
      const alive = this.getAlivePlayers();
      if (alive.length === 1) {
        this.isMatchOver = true;
        this.winner = alive[0];
        return {
          type: 'match_win',
          winner: alive[0],
          players: this.players,
          turnScore,
          survived
        };
      }

      const res = {
        type: 'turn_end',
        player,
        turnScore,
        survived,
        newTarget: this.targetScoreToBeat,
        livesRemaining: player.lives
      };

      this.finishTurn();
      return res;
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      dartsLeft: 3 - this.turnDarts.length,
      currentTurnTotal: this.turnDarts.reduce((acc, d) => acc + (d.score || 0), 0),
      targetScoreToBeat: this.targetScoreToBeat
    };
  }

  // Support direct turn score entry from keypad
  recordTurnScore(turnScore) {
    if (this.isMatchOver) return null;
    const player = this.getActivePlayer();
    if (player.isEliminated) {
      this.finishTurn();
      return null;
    }

    const snapshot = {
      playerIdx: this.activePlayerIdx,
      turnScore,
      targetScoreToBeat: this.targetScoreToBeat,
      targetSetByPlayer: this.targetSetByPlayer,
      players: this.players.map(p => ({
        lives: p.lives,
        isEliminated: p.isEliminated,
        roundsSurvived: p.roundsSurvived
      }))
    };
    this.history.push(snapshot);

    player.totalDarts += 3;
    player.turns.push(turnScore);

    let survived = true;
    let isFirstRound = this.targetScoreToBeat === 0 && !this.targetSetByPlayer;

    if (!isFirstRound) {
      if (turnScore < this.targetScoreToBeat) {
        survived = false;
        player.lives -= 1;
        if (player.lives <= 0) {
          player.lives = 0;
          player.isEliminated = true;
        }
      } else {
        player.roundsSurvived++;
        this.targetScoreToBeat = turnScore;
        this.targetSetByPlayer = player.name;
      }
    } else {
      this.targetScoreToBeat = turnScore;
      this.targetSetByPlayer = player.name;
      player.roundsSurvived++;
    }

    const alive = this.getAlivePlayers();
    if (alive.length === 1) {
      this.isMatchOver = true;
      this.winner = alive[0];
      return {
        type: 'match_win',
        winner: alive[0],
        players: this.players,
        turnScore,
        survived
      };
    }

    const res = {
      type: 'turn_end',
      player,
      turnScore,
      survived,
      newTarget: this.targetScoreToBeat,
      livesRemaining: player.lives
    };

    this.finishTurn();
    return res;
  }

  finishTurn() {
    this.turnDarts = [];
    if (this.isMatchOver) return;

    let count = 0;
    do {
      this.activePlayerIdx = (this.activePlayerIdx + 1) % this.players.length;
      count++;
    } while (this.players[this.activePlayerIdx].isEliminated && count < this.players.length);
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    this.activePlayerIdx = last.playerIdx;
    this.targetScoreToBeat = last.targetScoreToBeat;
    this.targetSetByPlayer = last.targetSetByPlayer;

    this.players.forEach((p, idx) => {
      p.lives = last.players[idx].lives;
      p.isEliminated = last.players[idx].isEliminated;
      p.roundsSurvived = last.players[idx].roundsSurvived;
    });

    const active = this.getActivePlayer();
    if (last.turnScore !== undefined) {
      active.totalDarts -= 3;
      active.turns.pop();
    } else {
      active.totalDarts--;
      this.turnDarts.pop();
    }

    this.isMatchOver = false;
    this.winner = null;

    return {
      player: active,
      targetScoreToBeat: this.targetScoreToBeat,
      livesRemaining: active.lives
    };
  }
}
