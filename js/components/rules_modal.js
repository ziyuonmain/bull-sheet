// Comprehensive Game Rules & Tutorial Guide for all BullSheet Game Modes
export const GAME_RULES = {
  x01: {
    title: "501 / X01 Darts",
    icon: "🎯",
    objective: "Be the first player to reduce your starting score (501, 301, 701, 101) to exactly 0.",
    rules: [
      "Each turn consists of throwing 3 darts.",
      "Your turn score is subtracted from your current total.",
      "Double Out (Default): You MUST finish on a Double segment (or the 50 Bullseye) that brings your score to exactly 0.",
      "Double In (Optional): You must hit any Double segment before your points start counting.",
      "Bust: If you score more than your remaining points, leave 1 point on Double Out, or hit a non-double on 0, your turn ends immediately and your score resets to what it was at the start of that visit.",
      "Checkouts: When your score is 170 or below, BullSheet displays the recommended PDC finish route (e.g. T20 ➔ T20 ➔ BULL).",
      "Undo: Tap ↶ UNDO anytime to correct any misplaced dart or turn."
    ],
    proTip: "Aim to set up preferred even finishes like 40 (D20), 32 (D16), or 36 (D18). If you miss inside into a single, you still leave an even double!"
  },
  cricket: {
    title: "Cricket & Cutthroat",
    icon: "🏏",
    objective: "Close the numbers 15 through 20 and the Bullseye before your opponents, while controlling the scoreboard.",
    rules: [
      "The active targets are: 20, 19, 18, 17, 16, 15, and Bull (25 / 50).",
      "To 'Close' a number, you must hit it 3 times (Single = 1 mark, Double = 2 marks, Treble = 3 marks, Outer Bull = 1 mark, Bullseye = 2 marks).",
      "Standard Cricket: Once you close a number, subsequent hits on it give YOU points, provided at least one opponent has not closed it yet. Highest score with all numbers closed wins.",
      "Cutthroat Cricket (Party favorite): Once you close a number, subsequent hits award penalty points to ALL opponents who haven't closed it. LOWEST score with all numbers closed wins!",
      "MPR (Marks Per Round): Tracks your live throwing efficiency throughout the match."
    ],
    proTip: "In Cutthroat, focus on closing the high numbers (20 & 19) first to punish your friends with penalty points!"
  },
  split_score: {
    title: "Split Score (Halve-It)",
    icon: "⚡",
    objective: "Hit the designated target in each round. If you miss all 3 darts in a round, your total score is CUT IN HALF!",
    rules: [
      "Round Sequences: Choose between 🎲 Random Shuffle (default dynamic mix of board targets), 📜 Classic Sequence (15, 16, D, 17, 18, T, 19, 20, Bull), or ✏️ Custom Sequence.",
      "Target Scoring: Every hit on the active round target adds points to your score (Single = 1x, Double = 2x, Treble = 3x, Double Round = any double, Treble Round = any treble, Bullseye = 25/50).",
      "THE SPLIT PENALTY: If you fail to land at least 1 dart on the target during your 3-dart visit (0 hits), your entire accumulated score is divided by 2 (rounded down).",
      "Hitting the target at least once (1, 2, or 3 hits) keeps your score SAFE and adds points.",
      "The player with the highest total score after the final round wins."
    ],
    proTip: "When your score is high, aim for a guaranteed safe Single on your 1st dart to protect against the 50% split penalty before going for risky Trebles!"
  },
  highscore: {
    title: "Highscore Mode",
    icon: "🏆",
    objective: "Accumulate as many total points as possible across 5, 7, or 10 rounds.",
    rules: [
      "In each round, throw 3 darts at any section of the board.",
      "Aim for the highest scoring segments (Treble 20 = 60, Treble 19 = 57, Bullseye = 50).",
      "No bust rules apply—every single point landed counts towards your total.",
      "After all rounds are complete, the player with the highest accumulated score wins the match."
    ],
    proTip: "If you are consistently drifting into 1s and 5s around the 20, switch your focus to Treble 19 for a more forgiving grouping."
  },
  shooter: {
    title: "Shooter (Target Drill)",
    icon: "🎯",
    objective: "Hit the designated target segment called out in each round to earn accuracy points.",
    rules: [
      "At the start of each round, a random board number is assigned as the active target (e.g. #18, #7, Bullseye).",
      "Only darts hitting the active target award points (Single = 1 pt, Double = 2 pts, Treble = 3 pts, Bull = 2 pts).",
      "Darts landing on other numbers score 0 points.",
      "The player with the most accumulated target hits after all rounds wins."
    ],
    proTip: "Great training drill to build muscle memory across unfamiliar areas of the board outside of just 20 and 19."
  },
  killer: {
    title: "Killer",
    icon: "🔪",
    objective: "Qualify as a 'Killer' and hunt your friends' lives until you are the last player standing.",
    rules: [
      "Each player is assigned a unique target number on the board (e.g., Alex = 18, Sarah = 14).",
      "Phase 1 (Qualifying): Hit the Double of your assigned number to qualify as a 'Killer'.",
      "Phase 2 (Hunting): Once you are a Killer, hit other players' numbers to deduct their lives (Single = -1 life, Double = -2, Treble = -3).",
      "Friendly Fire: If you accidentally hit your own number while a Killer, you lose 1 of your own lives!",
      "When a player loses all lives (0 lives), they are eliminated. The last surviving player wins."
    ],
    proTip: "Don't rush to become the first Killer if all your opponents are ready to gang up on you—strategy and timing are everything!"
  },
  elimination: {
    title: "Elimination (Knockout)",
    icon: "💥",
    objective: "Survive the gauntlet! Beat the 3-dart turn score set by the player before you, or lose a life.",
    rules: [
      "Each player starts with 3 to 5 lives (shields).",
      "The first player throws 3 darts to establish the initial 'Target Score to Beat'.",
      "The next player must score HIGHER than the target score. If they score equal or lower, they lose 1 life!",
      "If they successfully beat the target, they survive and their turn score becomes the NEW target score for the next player.",
      "Lose all lives and you are eliminated. The last surviving player wins."
    ],
    proTip: "If you are following a low target score (e.g. 26), you only need a safe 30+ to survive and pass the pressure to the next player."
  },
  shanghai: {
    title: "Shanghai",
    icon: "🏮",
    objective: "Score points on sequential numbers 1 through 7 (or 1–20), or pull off an instant **Shanghai Victory**!",
    rules: [
      "In Round 1 aim for 1, Round 2 aim for 2, through Round 7 (or Round 20).",
      "Only darts hitting the active round number score points (Single, Double, Treble).",
      "INSTANT SHANGHAI WIN: If a player hits a Single, a Double, AND a Treble of the active round number in the SAME 3-dart visit, they instantly win the entire match on the spot!",
      "Otherwise, the player with the highest total points at the end of the final round wins."
    ],
    proTip: "Always attempt the Treble first, then Double, then Single to maximize your Shanghai attempt."
  },
  around_clock: {
    title: "Around the Clock",
    icon: "⏰",
    objective: "Race around the board hitting numbers 1 through 20 in sequential order, finishing on the Bullseye.",
    rules: [
      "Start by aiming for 1. Once hit, advance to 2, then 3, all the way to 20.",
      "Bonus Multipliers: Hitting a Double leaps you 2 numbers ahead; hitting a Treble leaps you 3 numbers ahead!",
      "After hitting 20, you must land a dart in the Bullseye to win the match.",
      "First player to hit the Bullseye wins."
    ],
    proTip: "Aiming for the Treble ring gives you a chance to skip ahead 3 numbers at once!"
  }
};
