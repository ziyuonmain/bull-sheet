// Concise Game Rules Reference
export const GAME_RULES = {
  bobs27: {
    title: "Bob's 27",
    icon: "🎯",
    objective: "Start at 27 points. Survive 21 rounds from D1 to D20 + Bull without dropping to 0.",
    rules: [
      "21 total rounds: D1 in Round 1, D2 in Round 2, up to D20 and Bullseye (Round 21).",
      "Each round, throw 3 darts at the active double target.",
      "Hits add double points (e.g. 2 hits on D10 = +40 points).",
      "Miss all 3 darts: The double value is subtracted (e.g. 0 hits on D20 = -40 points).",
      "Knockout: If your score drops to 0 or below at any time, it's Game Over!",
      "Survive all 21 rounds with the highest positive score to win."
    ],
    proTip: "Protect your score on the high doubles (D16–D20) where a miss penalty hurts most!"
  },
  x01: {
    title: "501 / X01",
    icon: "🎯",
    objective: "Reduce score from 501/301/701 to exactly 0.",
    rules: [
      "3 darts per turn.",
      "Turn score is subtracted from remaining total.",
      "Double Out: Must finish on a Double (or 50 Bullseye) to reach 0.",
      "Double In (Optional): Points count only after hitting a Double.",
      "Bust: Exceeding score or leaving 1 on Double Out resets visit score.",
      "Checkouts: Shows PDC finish route when score is ≤ 170."
    ],
    proTip: "Set up even finishes like 40 (D20), 32 (D16), or 36 (D18)."
  },
  cricket: {
    title: "Cricket",
    icon: "🏏",
    objective: "Close numbers 15–20 and Bull before opponents.",
    rules: [
      "Active targets: 20, 19, 18, 17, 16, 15, and Bull.",
      "Hit target 3 times to close (Single = 1, Double = 2, Treble = 3).",
      "Standard: Scoring on a closed number awards points to you until all players close it.",
      "Cutthroat: Scoring on a closed number gives penalty points to open opponents. Lowest score wins.",
      "MPR tracks Marks Per Round efficiency."
    ],
    proTip: "In Cutthroat, close 20 and 19 first to pile penalty points onto opponents."
  },
  split_score: {
    title: "Split Score (Halve-It)",
    icon: "⚡",
    objective: "Hit the round target. Zero hits in a turn halves your score.",
    rules: [
      "Follows round target sequence (Random, Classic, or Custom).",
      "Target hits add points to your score.",
      "If all 3 darts miss the target, your total score is cut in half (rounded down).",
      "Highest total score at the end wins."
    ],
    proTip: "Aim for a safe Single on dart 1 to protect your score from halving."
  },
  highscore: {
    title: "Highscore",
    icon: "🏆",
    objective: "Score as many points as possible across fixed rounds.",
    rules: [
      "Throw 3 darts per round at any segment.",
      "All landed points add to total (no busts).",
      "Highest total score wins."
    ],
    proTip: "Aim for T20 (60 pts) or switch to T19 (57 pts) if drifting."
  },
  shooter: {
    title: "Shooter",
    icon: "🎯",
    objective: "Hit the designated target called each round.",
    rules: [
      "A random target is assigned each round.",
      "Only hits on the active target score points (Single = 1, Double = 2, Treble = 3, Bull = 2).",
      "Most target points wins."
    ],
    proTip: "Great drill for board-wide accuracy."
  },
  killer: {
    title: "Killer",
    icon: "🔪",
    objective: "Qualify as Killer and eliminate opponents' lives.",
    rules: [
      "Each player is assigned a unique board number.",
      "Hit your own Double to qualify as Killer.",
      "As Killer, hit opponents' numbers to deduct their lives.",
      "Hitting your own number as Killer costs 1 life.",
      "Last player with lives remaining wins."
    ],
    proTip: "Time your qualification so you don't become an immediate target."
  },
  elimination: {
    title: "Elimination",
    icon: "💥",
    objective: "Beat the previous player's 3-dart score or lose a life.",
    rules: [
      "Players start with 3 to 5 lives.",
      "Each player must score higher than the previous player's visit.",
      "Failing to beat the score loses 1 life.",
      "Last survivor wins."
    ],
    proTip: "After a low score, play safe to pass pressure to the next player."
  },
  shanghai: {
    title: "Shanghai",
    icon: "🏮",
    objective: "Score on sequential rounds 1–7 (or 1–20), or land an instant Shanghai win.",
    rules: [
      "Round number is the active scoring target.",
      "Instant Win: Hitting Single + Double + Treble in the same turn wins immediately.",
      "Otherwise, highest total points after final round wins."
    ],
    proTip: "Attempt Treble first, then Double, then Single."
  },
  around_clock: {
    title: "Around the Clock",
    icon: "⏰",
    objective: "Hit numbers 1 through 20 sequentially, ending on Bullseye.",
    rules: [
      "Hit numbers in order: 1 to 20, then Bullseye.",
      "Doubles leap 2 numbers; Trebles leap 3 numbers.",
      "First to hit Bullseye wins."
    ],
    proTip: "Aiming for Treble leaps you forward faster."
  }
};
