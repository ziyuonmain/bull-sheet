// Comprehensive & Accurate Game Rules Reference for BullSheet
export const GAME_RULES = {
  x01: {
    title: "X01 Darts",
    icon: "🎯",
    objective: "Reduce your starting score (101, 301, 501, 701, or 901) to exactly zero.",
    rules: [
      "Starting Scores: Choose 101, 301, 501, 701, or 901.",
      "Leg Format: First to 1, 3, 5, or 7 legs wins.",
      "In Rules: Straight In (score immediately), Double In (start scoring after a double), or Master In (start scoring after a double or treble).",
      "Out Rules: Double Out (official PDC finish on a double or bullseye), Single Out, or Master Out (finish on double or treble).",
      "Bust Rule: Exceeding your score, reaching 1 on Double Out, or failing the checkout condition reverts your score back to the start of the visit.",
      "PDC Checkout Guide: Automatically suggests optimal multi-dart checkout combinations when your score reaches 170 or below."
    ],
    proTip: "Leave even doubles like 40 (D20), 32 (D16), or 36 (D18) — an inside miss splits into a clean single."
  },
  cricket: {
    title: "Cricket (Standard & Cutthroat)",
    icon: "🏏",
    objective: "Close numbers 15 through 20 and the Bullseye before your opponents.",
    rules: [
      "Target Numbers: 15, 16, 17, 18, 19, 20, and Bullseye (25 / 50).",
      "Closing Targets: Hit a number 3 times to close it (Single = 1 mark, Double = 2 marks, Treble = 3 marks, Inner Bull = 2 marks).",
      "Standard Scoring: Once you close a number, subsequent hits score points for you until all opponents also close it.",
      "Cutthroat Mode: Once you close a number, extra hits give penalty points to any opponents who have not closed it. Lowest points wins!",
      "MPR (Marks Per Round): Tracks your overall mark efficiency per 3-dart visit."
    ],
    proTip: "In Cutthroat, prioritize closing 20 and 19 first to pile heavy penalty points onto opponents."
  },
  killer: {
    title: "Killer Party",
    icon: "⚔️",
    objective: "Hit your assigned Double to become a Killer, then eliminate opponents' lives while defending your own.",
    rules: [
      "Assigned Numbers: Each player receives a unique target sector (1–20) on the board.",
      "Qualification: Hit the Double ring of your assigned number (e.g. D10) to become a Killer.",
      "Eliminating Opponents: Once you are a Killer, hitting any opponent's number (Single, Double, or Treble) removes their lives.",
      "Life Changes: A hit removes lives based on its multiplier (1 for Single, 2 for Double, 3 for Treble). Hitting your own number after qualifying also costs lives.",
      "Starting Lives: Choose 3, 5, or 7. A player at 0 lives is eliminated; the last survivor wins."
    ],
    proTip: "Watch the board highlights! Your targets glow gold, while your own sector outlines in hazard red once you are a Killer."
  },
  bobs27: {
    title: "Bob's 27 (Double Training Drill)",
    icon: "🎲",
    objective: "Start with 27 points. Throw at doubles D1 through D20 and Bullseye without dropping to 0.",
    rules: [
      "21 Fixed Rounds: Round 1 is D1, Round 2 is D2, progressing sequentially to D20 and Bullseye in Round 21.",
      "3 Darts Per Round: Throw all 3 darts at the active round's double.",
      "Scoring Hits: Each hit adds the double's value (e.g. hitting two D10s awards 2 × 20 = +40 points).",
      "Miss Penalty: If you miss all 3 darts at the target, the double's value is subtracted from your score (e.g. 0 hits on D20 = -40 points).",
      "Knockout: If your score reaches 0 or falls negative at any point, you are instantly eliminated!",
      "Highest positive score after Round 21 wins the drill."
    ],
    proTip: "Protect your score on high numbers like D16–D20, where missing all 3 darts inflicts massive penalties."
  },
  split_score: {
    title: "Split Score (Halve-It)",
    icon: "➗",
    objective: "Hit the designated target each round. Failing to land at least one hit halves your total score.",
    rules: [
      "Sequences: Play the Classic sequence (15, 16, Double, 17, 18, Treble, 19, 20, Bull), Random, or Custom target sequences.",
      "Starting Score: Configurable starting score (0, 40, 50, or 100 points).",
      "Target Hits: All successful hits add points to your cumulative score (Doubles and Trebles multiply score accordingly).",
      "Halving Penalty: If you miss the target with all 3 darts in a round, your total score is cut in half (rounded down).",
      "The player with the highest total score after the final round wins."
    ],
    proTip: "Aim for a safe Single on your first dart to secure your score before risking doubles or trebles."
  },
  shanghai: {
    title: "Shanghai",
    icon: "🏮",
    objective: "Score maximum points across sequential rounds (1–7 or 1–20), or land an instant Shanghai win.",
    rules: [
      "Sequential Rounds: Play 7 rounds (1 to 7) or the full 20 rounds (1 to 20).",
      "Round Target: Each round, only hits on that round's number score points (Single = 1x, Double = 2x, Treble = 3x).",
      "Shanghai Instant Win: Hitting a Single, Double, and Treble of the active round in the same 3-dart turn wins the match immediately!",
      "If no Shanghai occurs, the player with the highest aggregate score after all rounds wins."
    ],
    proTip: "When aiming for a Shanghai, throw for the Treble first, then the Double, and finish on the large Single bed."
  },
  around_clock: {
    title: "Around the Clock",
    icon: "⏰",
    objective: "Race sequentially through numbers 1 to 20, finishing with the Bullseye.",
    rules: [
      "Sequential Progression: You must hit targets in order from 1 to 20, then the Bullseye.",
      "Multiplier Leaps: Singles advance you 1 number; Doubles leap forward 2 numbers; Trebles leap forward 3 numbers.",
      "Bullseye Finish: After passing 20, hitting Outer Bull (25) or Inner Bull (50) wins the race.",
      "First player to hit the Bullseye wins."
    ],
    proTip: "Take calculated shots at Trebles on easy angles to leap forward 3 numbers in a single throw."
  },
  elimination: {
    title: "Elimination",
    icon: "💀",
    objective: "Score at least as many points as the previous player's visit, or lose a life.",
    rules: [
      "Starting Lives: Choose 3, 5, or 7 lives.",
      "Target Score: Each player must equal or beat the previous player's 3-dart score.",
      "Life Loss: If your 3-dart score is lower than the previous player's score, you lose 1 life.",
      "Elimination: Players who lose all lives are eliminated. The last survivor wins."
    ],
    proTip: "If the previous player threw a low score, play conservative shots to easily beat it and pass high pressure to the next player."
  },
  highscore: {
    title: "Highscore",
    icon: "🏆",
    objective: "Score as many points as possible across 5, 7, or 10 rounds.",
    rules: [
      "Round Count: Choose between 5, 7, or 10 rounds.",
      "Open Scoring: Throw 3 darts per round at any segment on the board (no bust rules).",
      "All points scored are added to your running total.",
      "Highest total score at the end of the final round wins."
    ],
    proTip: "Target Treble 20 (60 pts). If your darts are blocking the bed, switch down to Treble 19 (57 pts)."
  },
  shooter: {
    title: "Shooter",
    icon: "🏹",
    objective: "Hit each randomly ordered target across 5, 7, or 10 rounds.",
    rules: [
      "Targets: Numbers are randomly ordered, with Bull as the final round's target.",
      "Scoring: Only hits on the active target score points (Single = 1 pt, Double = 2 pts, Treble = 3 pts; Outer Bull = 1 pt, Inner Bull = 2 pts).",
      "Player with the most target points after all rounds wins."
    ],
    proTip: "A supreme training routine for developing consistent accuracy across all 20 board sectors."
  }
};
