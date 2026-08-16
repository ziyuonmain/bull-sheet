// Elimination (Knockout) Game Engine with Deep Multi-Player Undo
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
      roundsSurvived: 0,
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
    const dartScore = Number(dart.score) || (Number(dart.number) * (Number(dart.mult) || 1));

    this.history.push({
      playerIdx: this.activePlayerIdx,
      dart,
      targetScoreToBeat: this.targetScoreToBeat,
      targetSetByPlayer: this.targetSetByPlayer,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({
        lives: p.lives,
        isEliminated: p.isEliminated,
        roundsSurvived: p.roundsSurvived,
        totalDarts: p.totalDarts
      }))
    });

    player.totalDarts++;
    this.turnDarts.push({ ...dart, score: dartScore });

    if (this.turnDarts.length === 3) {
      const turnTotal = this.turnDarts.reduce((a, d) => a + (d.score || 0), 0);
      let lostLife = false;

      if (this.targetScoreToBeat > 0) {
        if (turnTotal <= this.targetScoreToBeat) {
          player.lives--;
          lostLife = true;
          if (player.lives <= 0) {
            player.isEliminated = true;
          }
        } else {
          player.roundsSurvived++;
          this.targetScoreToBeat = turnTotal;
          this.targetSetByPlayer = player.name;
        }
      } else {
        // First player sets target
        this.targetScoreToBeat = turnTotal;
        this.targetSetByPlayer = player.name;
      }

      // Check remaining survivor
      const survivors = this.players.filter(p => !p.isEliminated);
      if (survivors.length === 1) {
        this.isMatchOver = true;
        this.winner = survivors[0];
        return {
          type: 'match_win',
          winner: survivors[0],
          players: this.players
        };
      }

      const res = {
        type: 'turn_end',
        player,
        turnScore: turnTotal,
        lostLife,
        livesRemaining: player.lives
      };

      this.finishTurn();
      return res;
    }

    return {
      type: 'dart_recorded',
      player,
      dart,
      dartsLeft: 3 - this.turnDarts.length
    };
  }

  finishTurn() {
    this.turnDarts = [];
    do {
      this.activePlayerIdx = (this.activePlayerIdx + 1) % this.players.length;
    } while (this.players[this.activePlayerIdx].isEliminated && !this.isMatchOver);
  }

  undo() {
    if (this.history.length === 0) return null;
    const last = this.history.pop();

    this.activePlayerIdx = last.playerIdx;
    this.targetScoreToBeat = last.targetScoreToBeat;
    this.targetSetByPlayer = last.targetSetByPlayer;

    if (last.playersSnapshot) {
      this.players.forEach((p, idx) => {
        const snap = last.playersSnapshot[idx];
        if (snap) {
          p.lives = snap.lives;
          p.isEliminated = snap.isEliminated;
          p.roundsSurvived = snap.roundsSurvived;
          p.totalDarts = snap.totalDarts;
        }
      });
    }

    this.turnDarts = last.turnDartsSnapshot || [];
    this.isMatchOver = false;
    this.winner = null;

    return {
      player: this.getActivePlayer(),
      dartsLeft: 3 - this.turnDarts.length
    };
  }
}
