// AI Bot Simulation Engine for Solo / Mixed Matches in BullSheet
import { CHECKOUT_TABLE, BOGEY_NUMBERS } from '../components/checkout.js';

export const BOT_PROFILES = {
  bullshitter: {
    id: 'bullshitter',
    name: 'The Bullshitter 🤡',
    description: 'Claims he threw for the national team. Throws 26 every second turn.',
    targetAvg: 35,
    t20Chance: 0.10,
    singleChance: 0.70,
    missChance: 0.20,
    doubleHitChance: 0.15
  },
  pub_regular: {
    id: 'pub_regular',
    name: 'Pub Regular Dave 🍺',
    description: 'Pint in one hand, steady relaxed pub league thrower.',
    targetAvg: 52,
    t20Chance: 0.25,
    singleChance: 0.65,
    missChance: 0.10,
    doubleHitChance: 0.30
  },
  accountant: {
    id: 'accountant',
    name: 'Clinical Accountant 📊',
    description: 'Calculates every angle with cold, ruthless arithmetic.',
    targetAvg: 74,
    t20Chance: 0.45,
    singleChance: 0.50,
    missChance: 0.05,
    doubleHitChance: 0.48
  },
  oche_master: {
    id: 'oche_master',
    name: 'Oche Master Jack 🎯',
    description: 'Local county champion with lethal treble and double precision.',
    targetAvg: 89,
    t20Chance: 0.60,
    singleChance: 0.38,
    missChance: 0.02,
    doubleHitChance: 0.65
  },
  machine180: {
    id: 'machine180',
    name: 'The 180 Machine 👑',
    description: 'World championship stage finalist. Almost never misses.',
    targetAvg: 104,
    t20Chance: 0.78,
    singleChance: 0.21,
    missChance: 0.01,
    doubleHitChance: 0.85
  }
};

export class BotEngine {
  constructor(profileId = 'pub_regular') {
    this.setProfile(profileId);
  }

  setProfile(profileId) {
    this.profile = BOT_PROFILES[profileId] || BOT_PROFILES.pub_regular;
  }

  // Simulate a single dart throw in X01 mode
  throwDartX01(currentScore, dartsLeftInTurn = 3, outMode = 'double') {
    const prof = this.profile;

    // Check if on a checkout
    if (currentScore <= 170 && !BOGEY_NUMBERS.includes(currentScore) && currentScore > 1) {
      const route = CHECKOUT_TABLE[currentScore];
      if (route && route.length <= dartsLeftInTurn) {
        const nextTarget = route[0];
        return this.simulateAimAt(nextTarget, prof.doubleHitChance);
      }
    }

    // Standard scoring: Aim at Treble 20 (or T19 if odd setup)
    let aimTarget = 'T20';
    if (currentScore < 200 && currentScore % 2 !== 0 && currentScore > 60) {
      aimTarget = 'T19';
    }

    return this.simulateAimAt(aimTarget, prof.t20Chance);
  }

  simulateAimAt(targetStr, hitProbability) {
    const rand = Math.random();

    let mult = 1;
    let num = 20;

    if (targetStr.startsWith('T')) {
      mult = 3;
      num = parseInt(targetStr.slice(1), 10);
    } else if (targetStr.startsWith('D')) {
      mult = 2;
      num = parseInt(targetStr.slice(1), 10);
    } else if (targetStr === 'Bull') {
      mult = 2;
      num = 25;
    } else if (targetStr === '25') {
      mult = 1;
      num = 25;
    } else {
      num = parseInt(targetStr.replace('S', ''), 10) || 20;
    }

    // Direct Hit
    if (rand < hitProbability) {
      return {
        number: num,
        mult: mult,
        score: num * mult,
        label: targetStr
      };
    }

    // Single hit of targeted number
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

    // Adjacent segment drift (e.g. 1 or 5 next to 20)
    const neighbors = {
      20: [1, 5],
      19: [7, 3],
      18: [4, 1],
      17: [2, 3],
      16: [7, 8],
      15: [10, 2],
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

  // Simulate a single dart in Cricket
  throwDartCricket(openTargets = [20, 19, 18, 17, 16, 15, 25]) {
    const prof = this.profile;
    const target = openTargets[0] || 20;
    const rand = Math.random();

    if (rand < prof.t20Chance) {
      const mult = target === 25 ? 2 : 3;
      return { number: target, mult: mult, label: target === 25 ? 'Bull' : `T${target}` };
    }
    if (rand < prof.t20Chance + prof.singleChance) {
      return { number: target, mult: 1, label: target === 25 ? '25' : `S${target}` };
    }
    return { number: 0, mult: 0, label: 'Miss' };
  }
}
