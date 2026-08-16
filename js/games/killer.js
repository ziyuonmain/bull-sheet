// Killer Game Engine with Full Multi-Player Life & Status Undo
export class KillerGame {
  constructor(config = {}) {
    this.startingLives = config.startingLives || 5;
    const assignedTargets = this.assignRandomTargets(config.players?.length || 2);

    this.players = (config.players || [{ name: 'Player 1' }, { name: 'Player 2' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      targetNumber: assignedTargets[idx] || (idx + 1),
      isKiller: false,
      lives: this.startingLives,
      kills: 0,
      isEliminated: false,
      totalDarts: 0
    }));

    this.activePlayerIdx = 0;
    this.turnDarts = [];
    this.history = [];
    this.isMatchOver = false;
    this.winner = null;
  }

  assignRandomTargets(playerCount) {
    const nums = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    return [...nums].sort(() => 0.5 - Math.random()).slice(0, playerCount);
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
    const dartNum = Number(dart.number);
    const dartMult = Number(dart.mult) || 1;

    // Snapshot for undo
    this.history.push({
      playerIdx: this.activePlayerIdx,
      dart,
      turnDartsSnapshot: [...this.turnDarts],
      playersSnapshot: this.players.map(p => ({
        lives: p.lives,
        isKiller: p.isKiller,
        kills: p.kills,
        isEliminated: p.isEliminated,
        totalDarts: p.totalDarts
      }))
    });

    player.totalDarts++;
    this.turnDarts.push(dart);

    // 1. If not yet Killer, hitting own Double qualifies as Killer
    if (!player.isKiller) {
      if (dartNum === player.targetNumber && dartMult >= 2) {
        player.isKiller = true;
      }
    } else {
      // 2. If Killer, hitting opponents' numbers removes lives
      this.players.forEach(opp => {
        if (!opp.isEliminated && opp.id !== player.id && dartNum === opp.targetNumber) {
          opp.lives = Math.max(0, opp.lives - dartMult);
          if (opp.lives === 0) {
            opp.isEliminated = true;
            player.kills++;
          }
        }
      });

      // Self hit penalty
      if (dartNum === player.targetNumber) {
        player.lives = Math.max(0, player.lives - dartMult);
        if (player.lives === 0) player.isEliminated = true;
      }
    }

    // Win condition: Only 1 survivor left
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

    if (this.turnDarts.length === 3) {
      const res = {
        type: 'visit_complete',
        player
      };
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
    if (last.playersSnapshot) {
      this.players.forEach((p, idx) => {
        const snap = last.playersSnapshot[idx];
        if (snap) {
          p.lives = snap.lives;
          p.isKiller = snap.isKiller;
          p.kills = snap.kills;
          p.isEliminated = snap.isEliminated;
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
