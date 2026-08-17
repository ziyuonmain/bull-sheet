// Intelligent Game-Mode-Aware AI Bot Simulation Engine for BullSheet with Evenly-Spanned Skill Tiers
import { CHECKOUT_TABLE, BOGEY_NUMBERS } from '../components/checkout.js';

export const BOT_PROFILES = {
  bullshitter: {
    id: 'bullshitter',
    name: '🤡 Beginner',
    description: 'Casual beginner with shaky aim, frequent misses, and chaotic pressure play.',
    skillRating: 'Beginner',
    t20Chance: 0.02,
    trebleHitChance: 0.02,
    doubleHitChance: 0.08,
    singleChance: 0.50,
    missChance: 0.35,
    tacticalIQ: 0.15
  },
  pub_regular: {
    id: 'pub_regular',
    name: '🍺 Casual',
    description: 'Steady pub league thrower with dependable single scoring and relaxed rhythm.',
    skillRating: 'Casual',
    t20Chance: 0.15,
    trebleHitChance: 0.15,
    doubleHitChance: 0.25,
    singleChance: 0.60,
    missChance: 0.15,
    tacticalIQ: 0.40
  },
  accountant: {
    id: 'accountant',
    name: '📊 Tactician',
    description: 'Disciplined match player. Calculates every risk and excels in defensive play.',
    skillRating: 'Tactician',
    t20Chance: 0.35,
    trebleHitChance: 0.35,
    doubleHitChance: 0.45,
    singleChance: 0.52,
    missChance: 0.05,
    tacticalIQ: 0.70
  },
  oche_master: {
    id: 'oche_master',
    name: '🎯 Semi-Pro',
    description: 'Tournament county ace with heavy treble scoring and clutch double finishes.',
    skillRating: 'Semi-Pro',
    t20Chance: 0.58,
    trebleHitChance: 0.58,
    doubleHitChance: 0.68,
    singleChance: 0.38,
    missChance: 0.02,
    tacticalIQ: 0.90
  },
  machine180: {
    id: 'machine180',
    name: '👑 Master',
    description: 'World-class stage champion. Near-flawless precision across all game modes.',
    skillRating: 'Master',
    t20Chance: 0.80,
    trebleHitChance: 0.80,
    doubleHitChance: 0.88,
    singleChance: 0.19,
    missChance: 0.01,
    tacticalIQ: 1.00
  }
};

export class BotEngine {
  constructor(profileId = 'pub_regular') {
    this.setProfile(profileId);
  }

  setProfile(profileId) {
    this.profile = BOT_PROFILES[profileId] || BOT_PROFILES.pub_regular;
  }

  // --- Master Dispatcher for Game Modes ---
  throwDart(gameType, gameInstance, activePlayer, dartIdx = 0) {
    switch (gameType) {
      case 'x01':
        return this.throwDartX01(activePlayer.score, 3 - dartIdx, gameInstance.outMode, activePlayer.hasDoubledIn);
      case 'cricket':
        return this.throwDartCricket(gameInstance, activePlayer);
      case 'split_score':
        return this.throwDartSplitScore(gameInstance, activePlayer, dartIdx);
      case 'killer':
        return this.throwDartKiller(gameInstance, activePlayer);
      case 'elimination':
        return this.throwDartElimination(gameInstance, activePlayer, dartIdx);
      case 'shanghai':
        return this.throwDartShanghai(gameInstance, activePlayer, dartIdx);
      case 'around_clock':
        return this.throwDartAroundClock(activePlayer);
      case 'shooter':
        return this.throwDartShooter(gameInstance);
      case 'bobs27':
        return this.throwDartBobs27(gameInstance, activePlayer);
      case 'highscore':
      default:
        return this.throwDartHighscore();
    }
  }


  // 1. X01 Mode (501 / 301)
  throwDartX01(currentScore, dartsLeftInTurn = 3, _outMode = 'double', hasDoubledIn = true) {
    const prof = this.profile;

    // Handle Double In if required
    if (!hasDoubledIn) {
      const preferredDoubles = ['D20', 'D16', 'D10', 'D8'];
      const targetD = preferredDoubles[Math.floor(Math.random() * preferredDoubles.length)];
      return this.simulateAimAt(targetD, prof.doubleHitChance);
    }

    // Check for checkout finishes (170 down to 2)
    if (currentScore <= 170 && !BOGEY_NUMBERS.includes(currentScore) && currentScore > 1) {
      const route = CHECKOUT_TABLE[currentScore];
      if (route && route.length <= dartsLeftInTurn) {
        const nextTarget = route[0];
        const isDouble = nextTarget.startsWith('D') || nextTarget === 'Bull';
        const hitProb = isDouble ? prof.doubleHitChance : prof.trebleHitChance;
        return this.simulateAimAt(nextTarget, hitProb);
      }
    }

    // Smart Setup Aim (e.g. Leave comfortable even numbers like 32 or 40)
    if (currentScore <= 70) {
      if (currentScore % 2 === 0 && currentScore <= 40) {
        return this.simulateAimAt(`D${currentScore / 2}`, prof.doubleHitChance);
      }
      // Odd score under 70: Shoot single to leave even double
      const singleToEven = currentScore % 2 === 1 ? 'S' + (currentScore - 32 > 0 ? (currentScore - 32) : 1) : 'S10';
      return this.simulateAimAt(singleToEven, prof.singleChance);
    }

    // Heavy Scoring: Aim T20 (or T19 for odd switch)
    let aimTarget = 'T20';
    if (currentScore < 200 && currentScore % 2 !== 0 && currentScore > 60) {
      aimTarget = 'T19';
    }

    return this.simulateAimAt(aimTarget, prof.t20Chance);
  }

  // 2. Cricket / Cutthroat Mode
  throwDartCricket(game, player) {
    const prof = this.profile;
    const targets = [20, 19, 18, 17, 16, 15, 25];

    // Find unclosed targets for this bot
    const unclosed = targets.filter(t => (player.marks[t] || 0) < 3);

    let chosenTarget = unclosed[0] || 20;

    // Tactical IQ decision: In Cutthroat, if already closed 20/19 and opponents are open, hammer them for points!
    if (game && game.mode === 'cutthroat' && prof.tacticalIQ > 0.6) {
      const closedHighs = targets.filter(t => (player.marks[t] || 0) >= 3);
      for (const t of closedHighs) {
        const opponentsOpen = game.players.some(p => p.id !== player.id && (p.marks[t] || 0) < 3);
        if (opponentsOpen) {
          chosenTarget = t;
          break;
        }
      }
    }

    const hitTreble = Math.random() < prof.trebleHitChance;
    if (chosenTarget === 25) {
      const hitBull = Math.random() < prof.doubleHitChance;
      return this.simulateAimAt(hitBull ? 'Bull' : '25', prof.doubleHitChance);
    }

    return this.simulateAimAt(hitTreble ? `T${chosenTarget}` : `S${chosenTarget}`, prof.trebleHitChance);
  }

  // 3. Split Score (Halve-It) Mode
  throwDartSplitScore(game, player, dartIdx) {
    const prof = this.profile;
    const round = game.getCurrentRound ? game.getCurrentRound() : { targetType: 'num', value: 20 };

    // Risk Management: If score is high (>80) and 0 hits on dart 1/2, smart bots aim safe to avoid 50% cut!
    const isDesperate = player.score >= 80 && player.hitsThisRound === 0 && dartIdx >= 1;

    if (round.targetType === 'num') {
      const num = round.value;
      if (isDesperate && prof.tacticalIQ > 0.5) {
        return this.simulateAimAt(`S${num}`, prof.singleChance + 0.15);
      }
      const aimTreble = Math.random() < prof.trebleHitChance;
      return this.simulateAimAt(aimTreble ? `T${num}` : `S${num}`, prof.trebleHitChance);
    }

    if (round.targetType === 'double') {
      const bestDouble = ['D20', 'D16', 'D10', 'D8'][Math.floor(Math.random() * 4)];
      return this.simulateAimAt(bestDouble, prof.doubleHitChance);
    }

    if (round.targetType === 'treble') {
      const bestTreble = ['T20', 'T19', 'T18'][Math.floor(Math.random() * 3)];
      return this.simulateAimAt(bestTreble, prof.trebleHitChance);
    }

    if (round.targetType === 'bull') {
      return this.simulateAimAt('Bull', prof.doubleHitChance);
    }

    return this.simulateAimAt('S20', prof.singleChance);
  }

  // 4. Killer Mode
  throwDartKiller(game, player) {
    const prof = this.profile;

    // Phase 1: Not killer yet -> Aim at own Double to qualify!
    if (!player.isKiller) {
      return this.simulateAimAt(`D${player.targetNumber}`, prof.doubleHitChance);
    }

    // Phase 2: Hunt opponents
    const liveOpponents = game.players.filter(p => !p.isEliminated && p.id !== player.id);
    if (liveOpponents.length === 0) {
      return this.simulateAimAt('S20', 0.5);
    }

    // Smart Bot: Prioritize opponent with lowest lives
    let victim = liveOpponents[0];
    if (prof.tacticalIQ > 0.5) {
      victim = liveOpponents.reduce((prev, curr) => (curr.lives < prev.lives ? curr : prev), liveOpponents[0]);
    }

    const shootTreble = Math.random() < prof.trebleHitChance;
    return this.simulateAimAt(shootTreble ? `T${victim.targetNumber}` : `D${victim.targetNumber}`, prof.doubleHitChance);
  }

  // 5. Elimination (Knockout) Mode
  throwDartElimination(game, player, dartIdx) {
    const prof = this.profile;
    const targetToBeat = game.targetScoreToBeat || 0;
    const scoredSoFar = (game.turnDarts || []).reduce((sum, d) => sum + (d.score || 0), 0);
    const needed = Math.max(0, targetToBeat - scoredSoFar + 1);

    if (needed > 60 && dartIdx === 2) {
      return this.simulateAimAt('T20', prof.trebleHitChance);
    }

    if (needed <= 20) {
      return this.simulateAimAt('S20', prof.singleChance);
    }

    return this.simulateAimAt('T20', prof.t20Chance);
  }

  // 6. Shanghai Mode
  throwDartShanghai(game, player, dartIdx) {
    const prof = this.profile;
    const target = game.currentRound || 1;

    // Check what parts of Shanghai visit have already landed
    const targetDarts = (game.turnDarts || []).filter(d => Number(d.number) === target);
    const hasS = targetDarts.some(d => Number(d.mult) === 1);
    const hasD = targetDarts.some(d => Number(d.mult) === 2);
    const hasT = targetDarts.some(d => Number(d.mult) === 3);

    // If bot has already hit Single and Double, ruthlessly go for Treble for instant win!
    if (hasS && hasD && !hasT) {
      return this.simulateAimAt(`T${target}`, prof.trebleHitChance);
    }
    if (hasS && !hasD && hasT) {
      return this.simulateAimAt(`D${target}`, prof.doubleHitChance);
    }

    // Standard Shanghai visit order: Treble ➔ Double ➔ Single
    if (dartIdx === 0) return this.simulateAimAt(`T${target}`, prof.trebleHitChance);
    if (dartIdx === 1) return this.simulateAimAt(`D${target}`, prof.doubleHitChance);
    return this.simulateAimAt(`S${target}`, prof.singleChance);
  }

  // 7. Around the Clock Mode
  throwDartAroundClock(player) {
    const prof = this.profile;
    const target = player.currentTarget || 1;

    if (target === 25) {
      return this.simulateAimAt('Bull', prof.doubleHitChance);
    }

    // Advanced bots aim for Treble to leap 3 numbers ahead!
    const tryTrebleLeap = prof.tacticalIQ > 0.7 && Math.random() < prof.trebleHitChance;
    return this.simulateAimAt(tryTrebleLeap ? `T${target}` : `S${target}`, prof.singleChance);
  }

  // 8. Shooter Mode
  throwDartShooter(game) {
    const prof = this.profile;
    const target = game.getCurrentTarget ? game.getCurrentTarget() : 20;

    if (target === 25) {
      return this.simulateAimAt('Bull', prof.doubleHitChance);
    }

    const shootTreble = Math.random() < prof.trebleHitChance;
    return this.simulateAimAt(shootTreble ? `T${target}` : `S${target}`, prof.trebleHitChance);
  }

  // 9. Highscore Mode
  throwDartHighscore() {
    const prof = this.profile;
    return this.simulateAimAt('T20', prof.t20Chance);
  }

  // Dynamic Live Calibration: Mirrors human player's current match form +- 3 pts
  adjustAdaptiveProfile(game) {
    if (this.profile.id !== 'adaptive' || !game || !game.players) return;
    const human = game.players.find(p => !p.isBot);
    if (!human) return;

    let humanAvg = 50;
    if (human.turns && human.turns.length > 0) {
      const sum = human.turns.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
      humanAvg = sum / human.turns.length;
    } else if (human.totalScoreScored && human.totalDartsThrown > 0) {
      humanAvg = (human.totalScoreScored / human.totalDartsThrown) * 3;
    }

    const norm = Math.max(0.05, Math.min(0.95, (humanAvg - 20) / 75));
    this.profile.trebleHitChance = 0.05 + norm * 0.55;
    this.profile.t20Chance = this.profile.trebleHitChance;
    this.profile.doubleHitChance = 0.12 + norm * 0.60;
    this.profile.singleChance = 0.50 + (1 - norm) * 0.15;
    this.profile.missChance = Math.max(0.01, 0.25 * (1 - norm));
    this.profile.tacticalIQ = 0.3 + norm * 0.6;
  }

  // 10. Bob's 27 Double Training
  throwDartBobs27(game) {
    this.adjustAdaptiveProfile(game);
    const prof = this.profile;
    const target = game.getCurrentTarget ? game.getCurrentTarget() : { number: 1, mult: 2, label: 'D1' };
    return this.simulateAimAt(target.label, prof.doubleHitChance);
  }

  // --- Segment Physics & Accuracy Simulation ---
  simulateAimAt(targetStr, hitProbability) {
    const rand = Math.random();

    let mult;
    let num;

    if (targetStr.startsWith('T')) {
      mult = 3;
      num = parseInt(targetStr.slice(1), 10);
    } else if (targetStr.startsWith('D')) {
      mult = 2;
      num = parseInt(targetStr.slice(1), 10);
    } else if (targetStr === 'Bull' || targetStr === 'BULL') {
      mult = 2;
      num = 25;
    } else if (targetStr === '25') {
      mult = 1;
      num = 25;
    } else {
      num = parseInt(targetStr.replace('S', ''), 10) || 20;
    }

    // 1. Direct Exact Hit (Treble, Double, Bullseye, or Single)
    if (rand < hitProbability) {
      return {
        number: num,
        mult: mult,
        score: num * mult,
        label: targetStr
      };
    }

    // 2. Single hit on the targeted number (Missed wire inside/outside)
    if (rand < hitProbability + this.profile.singleChance) {
      if (num === 25) {
        return { number: 25, mult: 1, score: 25, label: '25' };
      }
      return {
        number: num,
        mult: 1,
        score: num,
        label: `S${num}`
      };
    }

    // 3. Complete Miss (Catch ring or off board, especially for beginners)
    if (Math.random() < this.profile.missChance) {
      return {
        number: 0,
        mult: 0,
        score: 0,
        label: 'Miss'
      };
    }

    // 4. Board Neighbor Drift (e.g. 1 or 5 next to 20)
    const neighbors = {
      20: [1, 5],
      19: [7, 3],
      18: [4, 1],
      17: [2, 3],
      16: [7, 8],
      15: [10, 2],
      14: [11, 9],
      13: [6, 4],
      12: [5, 9],
      11: [14, 8],
      10: [15, 6],
      9: [12, 14],
      8: [11, 16],
      7: [16, 19],
      6: [13, 10],
      5: [20, 12],
      4: [18, 13],
      3: [19, 17],
      2: [17, 15],
      1: [20, 18],
      25: [1, 20, 3, 6]
    };

    const adj = neighbors[num] || [1, 5];
    const hitNum = adj[Math.floor(Math.random() * adj.length)];
    return {
      number: hitNum,
      mult: 1,
      score: hitNum,
      label: `S${hitNum}`
    };
  }
}
