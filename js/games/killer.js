// Killer Game Engine (2-8 Players, Target Assignments, Killer Status, Elimination)
export class KillerGame {
  constructor(config = {}) {
    this.startingLives = config.startingLives || 5;
    
    // Assign targets or auto-distribute
    const defaultTargets = [20, 19, 18, 17, 16, 15, 14, 13];

    this.players = (config.players || [{ name: 'Player 1' }, { name: 'Player 2' }]).map((p, idx) => ({
      id: p.id || `p_${idx}`,
      name: p.name,
      isBot: !!p.isBot,
      botProfile: p.botProfile || 'pub_regular',
      targetNumber: p.targetNumber || defaultTargets[idx % defaultTargets.length],
      lives: this.startingLives,
      isKiller: false,
      isEliminated: false,
      totalDarts: 0,
      kills: 0
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

    const hitNumber = dart.number;
    const hitMult = dart.mult || 1;

    // Snapshot for undo
    const snapshot = {
      playerIdx: this.activePlayerIdx,
      dart,
      players: this.players.map(p => ({
        lives: p.lives,
        isKiller: p.isKiller,
        isEliminated: p.isEliminated,
        kills: p.kills
      }))
    };
    this.history.push(snapshot);

    player.totalDarts++;
    this.turnDarts.push(dart);

    let eventType = 'dart_recorded';
    let targetPlayer = null;

    // 1. If not killer yet: must hit own double to become Killer
    if (!player.isKiller) {
      if (hitNumber === player.targetNumber && hitMult >= 2) {
        player.isKiller = true;
        eventType = 'became_killer';
      }
    } else {
      // 2. If already a Killer:
      // Check if hitting another active player's number
      const hitOpponent = this.players.find(p => !p.isEliminated && p.id !== player.id && p.targetNumber === hitNumber);
      
      if (hitOpponent) {
        hitOpponent.lives -= hitMult;
        targetPlayer = hitOpponent;
        eventType = 'life_lost';

        if (hitOpponent.lives <= 0) {
          hitOpponent.lives = 0;
          hitOpponent.isEliminated = true;
          player.kills++;
          eventType = 'eliminated';
        }
      } else if (hitNumber === player.targetNumber) {
        // Penalty for hitting own number: lose 1 life!
        player.lives -= 1;
        targetPlayer = player;
        eventType = 'suicide_hit';
        if (player.lives <= 0) {
          player.lives = 0;
          player.isEliminated = true;
          eventType = 'eliminated';
        }
      }
    }

    // Check Win Condition: Only 1 alive player remaining
    const alive = this.getAlivePlayers();
    if (alive.length === 1) {
      this.isMatchOver = true;
      this.winner = alive[0];
      return {
        type: 'match_win',
        winner: alive[0],
        players: this.players
      };
    }

    if (this.turnDarts.length === 3) {
      const res = {
        type: 'turn_end',
        player,
        eventType,
        targetPlayer
      };
      this.finishTurn();
      return res;
    }

    return {
      type: eventType,
      player,
      dart,
      targetPlayer,
      dartsLeft: 3 - this.turnDarts.length
    };
  }

  finishTurn() {
    this.turnDarts = [];
    if (this.isMatchOver) return;

    // Advance to next non-eliminated player
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
    this.players.forEach((p, idx) => {
      p.lives = last.players[idx].lives;
      p.isKiller = last.players[idx].isKiller;
      p.isEliminated = last.players[idx].isEliminated;
      p.kills = last.players[idx].kills;
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
