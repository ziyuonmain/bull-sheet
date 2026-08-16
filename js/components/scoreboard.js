// Ultra High-Visibility & Intuitive Scoreboard Renderer for BullSheet
export class Scoreboard {
  renderNextPlayerBanner(game) {
    if (!game || game.turnDarts.length < 3 || game.isMatchOver) return '';
    const nextP = game.getNextPlayer ? game.getNextPlayer() : null;
    return `
      <div class="next-player-banner">
        <button id="btn-scoreboard-next-player" class="btn-advance-turn-prominent" type="button">
          <span class="btn-next-main-text">➔ NEXT PLAYER ${nextP ? `(${nextP.name})` : ''}</span>
          <span class="btn-next-sub-hint">Tap to pass oche • or enter next dart</span>
        </button>
      </div>
    `;
  }

  constructor(containerEl) {
    this.container = containerEl;
  }

  // 1. Render X01 Scoreboard
  renderX01(game) {
    const active = game.getActivePlayer();
    const dartsLeft = 3 - game.turnDarts.length;
    const checkout = game.getCheckout(active.score, dartsLeft);
    const turnTotal = game.turnDarts.reduce((acc, d) => acc + (d.score || 0), 0);

    let html = `
      <div class="scoreboard-x01">
        <!-- Giant Active Player Turn Card -->
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <div class="hero-legs-sets">
              <span class="pill-stat">Set <strong>${active.setsWon}</strong></span>
              <span class="pill-stat highlight-legs">Legs <strong>${active.legsWon}</strong></span>
            </div>
          </div>

          <!-- Main Giant Score -->
          <div class="hero-score-row">
            <div class="score-display-block">
              <span class="score-sub-label">POINTS REMAINING</span>
              <div class="hero-big-score" id="hero-score-val">${active.score}</div>
            </div>
            
            <!-- Live Turn Progress Breakdown -->
            <div class="turn-breakdown-box">
              <div class="turn-box-title">THIS TURN: <strong class="turn-sum-val">+${turnTotal}</strong></div>
              <div class="hero-turn-darts">
                <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}">
                  <span class="dart-slot-num">1</span>
                  <strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong>
                </div>
                <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}">
                  <span class="dart-slot-num">2</span>
                  <strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong>
                </div>
                <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}">
                  <span class="dart-slot-num">3</span>
                  <strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Prominent Checkout Route Guidance -->
          <div class="checkout-banner ${checkout ? 'has-checkout' : 'no-checkout'}">
            <div class="checkout-icon">🎯</div>
            <div class="checkout-content">
              <span class="checkout-label">${checkout ? 'RECOMMENDED FINISH ROUTE:' : 'TACTICAL ADVICE:'}</span>
              <span class="checkout-route">${checkout ? checkout.join(' ➔ ') : (active.score <= 170 ? 'Bogey number — Set up a finish' : 'Setup target: Treble 20 (60 pts)')}</span>
            </div>
          </div>

          

          <!-- Live Player Statistics Bar -->
          <div class="hero-stats-bar">
            <div class="stat-item">
              <span class="stat-label">3-Dart Average</span>
              <span class="stat-val">${game.getPlayerAvg(active)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">First 9 Avg</span>
              <span class="stat-val">${game.getFirst9Avg(active)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Highest Visit</span>
              <span class="stat-val">${active.highTurn || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">180s Hit</span>
              <span class="stat-val highlight-180">${active.count180}</span>
            </div>
          </div>
        </div>

        <!-- Multiplayer Standings Strip -->
        <div class="multiplayer-strip-container">
          <div class="strip-header-label">ALL PLAYERS STANDINGS</div>
          <div class="multiplayer-strip">
            ${game.players.map((p, i) => `
              <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
                <div class="mini-card-header">
                  <span class="mini-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</span>
                  <span class="mini-legs">L: ${p.legsWon} | S: ${p.setsWon}</span>
                </div>
                <div class="mini-score">${p.score}</div>
                <div class="mini-avg-badge">Avg: ${game.getPlayerAvg(p)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 2. Render Cricket Scoreboard
  renderCricket(game) {
    const active = game.getActivePlayer();
    const targets = [20, 19, 18, 17, 16, 15, 25];

    const markSymbols = {
      0: '<span class="mark-none">•</span>',
      1: '<span class="mark-slash">/</span>',
      2: '<span class="mark-cross">✕</span>',
      3: '<span class="mark-closed">⨂</span>'
    };

    let html = `
      <div class="scoreboard-cricket">
        <div class="cricket-active-bar">
          <div class="active-info">
            <span class="active-pulse-badge">▶ THROWING</span>
            <h3>${active.name} ${active.isBot ? '<small>(BOT)</small>' : ''}</h3>
          </div>
          <div class="cricket-turn-darts">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
        </div>

        <div class="cricket-table-wrapper">
          <table class="cricket-table">
            <thead>
              <tr>
                ${game.players.map((p, i) => `
                  <th class="${i === game.activePlayerIdx ? 'active-col' : ''}">
                    <div class="th-name">${p.name}</div>
                    <div class="th-score">${p.score} pts</div>
                    <div class="th-mpr">MPR: <strong>${game.getPlayerMPR(p)}</strong></div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${targets.map(t => {
                const label = t === 25 ? 'BULL' : `${t}`;
                return `
                  <tr class="cricket-row">
                    ${game.players.map((p, i) => `
                      <td class="${i === game.activePlayerIdx ? 'active-col' : ''} ${p.marks[t] >= 3 ? 'is-closed' : ''}">
                        <span class="target-row-label">${label}</span>
                        <div class="mark-display">${markSymbols[p.marks[t]]}</div>
                      </td>
                    `).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 3. Render Highscore Scoreboard
  renderHighscore(game) {
    const active = game.getActivePlayer();
    const turnTotal = game.turnDarts.reduce((acc, d) => acc + (d.score || 0), 0);

    let html = `
      <div class="scoreboard-highscore">
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">ROUND ${Math.min(game.currentRound, game.maxRounds)} OF ${game.maxRounds}${game.currentRound >= game.maxRounds ? " (FINAL)" : ""}</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">Score: <strong>${active.score}</strong> pts</span>
          </div>

          <div class="hero-score-row">
            <div class="score-display-block">
              <span class="score-sub-label">TOTAL ACCUMULATED</span>
              <div class="hero-big-score">${active.score}</div>
            </div>

            <div class="turn-breakdown-box">
              <div class="turn-box-title">THIS VISIT: <strong class="turn-sum-val">+${turnTotal}</strong></div>
              <div class="hero-turn-darts">
                <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
                <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
                <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
              </div>
            </div>
          </div>
          
        </div>

        <div class="multiplayer-strip-container" style="margin-top:14px;">
          <div class="strip-header-label">ALL PLAYERS STANDINGS</div>
          <div class="multiplayer-strip">
            ${game.players.map((p, i) => `
              <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
                <div class="mini-name">${p.name}</div>
                <div class="mini-score">${p.score}</div>
                <div class="mini-avg-badge">Avg: ${game.getPlayerAvg(p)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 4. Render Shooter Scoreboard
  renderShooter(game) {
    const active = game.getActivePlayer();
    const target = game.getCurrentTarget();
    const targetLabel = target === 25 ? 'BULLSEYE 🎯' : `#${target}`;

    let html = `
      <div class="scoreboard-shooter">
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">ROUND ${Math.min(game.currentRound, game.maxRounds)} OF ${game.maxRounds}${game.currentRound >= game.maxRounds ? " (FINAL)" : ""}</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">Hits: <strong>${active.score}</strong></span>
          </div>

          <div class="shooter-target-banner-hero">
            <span class="score-sub-label">ACTIVE TARGET</span>
            <div class="shooter-target-large">${targetLabel}</div>
            <span class="target-sub-hint">Hit Single (1x), Double (2x), Treble (3x)</span>
          </div>

          <div class="hero-turn-darts" style="justify-content:center; margin-top:12px;">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
          
        </div>

        <div class="multiplayer-strip-container" style="margin-top:14px;">
          <div class="strip-header-label">ALL PLAYERS STANDINGS</div>
          <div class="multiplayer-strip">
            ${game.players.map((p, i) => `
              <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
                <div class="mini-name">${p.name}</div>
                <div class="mini-score">${p.score} <small>hits</small></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 5. Render Killer Scoreboard
  renderKiller(game) {
    const active = game.getActivePlayer();

    let html = `
      <div class="scoreboard-killer">
        <div class="hero-player-card ${active.isKiller ? 'is-killer-hero' : ''}">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isKiller ? '<span class="killer-badge">🔪 KILLER</span>' : '<span class="status-qualifying">Target: Double ' + active.targetNumber + ' to Qualify</span>'}</h2>
            </div>
            <span class="pill-stat highlight-legs">Lives: <strong>${active.lives}</strong></span>
          </div>

          <div class="hero-turn-darts" style="justify-content:center; margin-top:12px;">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
        </div>

        <div class="killer-grid" style="margin-top:16px;">
          ${game.players.map((p, i) => {
            const livesArray = Array.from({ length: game.startingLives }, (_, idx) => idx < p.lives);
            return `
              <div class="killer-card ${i === game.activePlayerIdx ? 'is-active' : ''} ${p.isEliminated ? 'is-dead' : ''} ${p.isKiller ? 'is-killer-card' : ''}">
                <div class="killer-card-top">
                  <div class="k-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</div>
                  <div class="k-target">#${p.targetNumber}</div>
                </div>
                
                <div class="k-status">
                  ${p.isEliminated ? '<span class="badge-eliminated">☠️ ELIMINATED</span>' : (p.isKiller ? '<span class="badge-killer">🔪 KILLER</span>' : '<span class="badge-hunt">Needs D' + p.targetNumber + '</span>')}
                </div>

                <div class="k-lives-row">
                  ${livesArray.map(alive => `<span class="life-heart ${alive ? 'alive' : 'lost'}">${alive ? '❤️' : '🖤'}</span>`).join('')}
                </div>
                <div class="k-kills">Kills: <strong>${p.kills}</strong></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 6. Ultra-Enhanced Split Score (Halve-It) Scoreboard
  renderSplitScore(game) {
    const active = game.getActivePlayer();
    const round = game.getCurrentRound();
    const turnPoints = game.turnDarts.reduce((acc, d) => acc + (d.pointsScored || 0), 0);
    const hasHit = active.hitsThisRound > 0;

    let html = `
      <div class="scoreboard-split">
        <!-- Giant High-Visibility Round Card -->
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">ROUND ${game.currentRoundIdx + 1} OF ${game.rounds.length}</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">Score: <strong>${active.score}</strong></span>
          </div>

          <!-- Massive Ultra-Glowing Target Box -->
          <div class="split-target-box-hero">
            <span class="split-target-sublabel">🎯 CURRENT ROUND TARGET</span>
            <div class="split-target-giant-title">${round.label}</div>
            <div class="split-target-desc-badge">
              ${round.targetType === 'num' ? `Aim for segment ${round.value} (Single, Double, Treble)` : (round.targetType === 'double' ? 'Aim for ANY Outer Ring Double or Bullseye' : (round.targetType === 'treble' ? 'Aim for ANY Inner Treble Ring' : 'Aim for the Center Bullseye'))}
            </div>
            <div class="split-danger-status ${hasHit ? 'status-safe' : 'status-danger'}">
              ${hasHit ? `✅ SAFE! (${active.hitsThisRound} hit${active.hitsThisRound > 1 ? 's' : ''} recorded: +${turnPoints} pts)` : '⚠️ 0 Hits so far — Must hit target or score will be CUT IN HALF!'}
            </div>
          </div>

          <!-- Turn Darts Progress -->
          <div class="turn-breakdown-box" style="margin-top:12px; align-items:center;">
            <div class="turn-box-title">DART PROGRESS THIS ROUND:</div>
            <div class="hero-turn-darts">
              <div class="dart-slot ${game.turnDarts[0] ? (game.turnDarts[0].isHit ? 'filled-hit' : 'filled-miss') : ''}">
                <span class="dart-slot-num">1</span>
                <strong class="dart-slot-val">${game.turnDarts[0] ? (game.turnDarts[0].isHit ? `✅ ${game.turnDarts[0].label}` : `❌ ${game.turnDarts[0].label}`) : '—'}</strong>
              </div>
              <div class="dart-slot ${game.turnDarts[1] ? (game.turnDarts[1].isHit ? 'filled-hit' : 'filled-miss') : ''}">
                <span class="dart-slot-num">2</span>
                <strong class="dart-slot-val">${game.turnDarts[1] ? (game.turnDarts[1].isHit ? `✅ ${game.turnDarts[1].label}` : `❌ ${game.turnDarts[1].label}`) : '—'}</strong>
              </div>
              <div class="dart-slot ${game.turnDarts[2] ? (game.turnDarts[2].isHit ? 'filled-hit' : 'filled-miss') : ''}">
                <span class="dart-slot-num">3</span>
                <strong class="dart-slot-val">${game.turnDarts[2] ? (game.turnDarts[2].isHit ? `✅ ${game.turnDarts[2].label}` : `❌ ${game.turnDarts[2].label}`) : '—'}</strong>
              </div>
            </div>
          </div>

          <!-- Horizontal Round Progression Bar -->
          <div class="split-rounds-timeline">
            ${game.rounds.map((r, i) => {
              const isPast = i < game.currentRoundIdx;
              const isCurrent = i === game.currentRoundIdx;
              return `
                <div class="timeline-step ${isCurrent ? 'is-active-step' : (isPast ? 'is-past-step' : '')}">
                  <span class="timeline-lbl">${r.label}</span>
                  <span class="timeline-dot">${isPast ? '✓' : (isCurrent ? '●' : '○')}</span>
                </div>
              `;
            }).join('')}
          </div>
          
        </div>

        <!-- Standings -->
        <div class="multiplayer-strip-container" style="margin-top:14px;">
          <div class="strip-header-label">ALL PLAYERS STANDINGS</div>
          <div class="multiplayer-strip">
            ${game.players.map((p, i) => `
              <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
                <div class="mini-name">${p.name}</div>
                <div class="mini-score">${p.score}</div>
                <div class="mini-avg-badge">${i === game.activePlayerIdx ? `Hits: ${p.hitsThisRound}` : 'Standby'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 7. Render Shanghai Scoreboard
  renderShanghai(game) {
    const active = game.getActivePlayer();

    let html = `
      <div class="scoreboard-shanghai">
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">ROUND ${Math.min(game.currentRound, game.maxRounds)} OF ${game.maxRounds}${game.currentRound >= game.maxRounds ? " (FINAL)" : ""}</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">Score: <strong>${active.score}</strong></span>
          </div>

          <div class="shanghai-target-hero">
            <span class="score-sub-label">ACTIVE TARGET</span>
            <div class="shanghai-target-big">#${game.currentRound}</div>
            <span class="shanghai-golden-rule">🔥 Hit Single, Double, & Treble in one visit for INSTANT SHANGHAI WIN!</span>
          </div>

          <div class="hero-turn-darts" style="justify-content:center; margin-top:12px;">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
          
        </div>

        <div class="multiplayer-strip-container" style="margin-top:14px;">
          <div class="strip-header-label">ALL PLAYERS STANDINGS</div>
          <div class="multiplayer-strip">
            ${game.players.map((p, i) => `
              <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
                <div class="mini-name">${p.name}</div>
                <div class="mini-score">${p.score}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 8. Render Elimination (Knockout) Scoreboard
  renderElimination(game) {
    const active = game.getActivePlayer();
    const turnTotal = game.turnDarts.reduce((acc, d) => acc + (d.score || 0), 0);

    let html = `
      <div class="scoreboard-elimination">
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">Shields: <strong>${active.lives}</strong></span>
          </div>

          <div class="elim-target-hero-banner">
            <span class="score-sub-label">SCORE TO BEAT</span>
            <div class="elim-target-huge">${game.targetScoreToBeat}</div>
            <span class="target-by-text">${game.targetSetByPlayer ? `Set by ${game.targetSetByPlayer}` : 'First player sets the target!'}</span>
          </div>

          <div class="turn-breakdown-box" style="margin-top:12px;">
            <div class="turn-box-title">CURRENT VISIT: <strong class="turn-sum-val">${turnTotal}</strong> / Need ${game.targetScoreToBeat}</div>
            <div class="hero-turn-darts" style="justify-content:center;">
              <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
            </div>
          </div>
          
        </div>

        <div class="elim-players-grid" style="margin-top:16px;">
          ${game.players.map((p, i) => {
            const strikes = Array.from({ length: game.startingLives }, (_, idx) => idx < p.lives);
            return `
              <div class="elim-card ${i === game.activePlayerIdx ? 'is-active' : ''} ${p.isEliminated ? 'is-eliminated' : ''}">
                <div class="el-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</div>
                <div class="el-status">${p.isEliminated ? '☠️ OUT' : '🛡️ SURVIVING'}</div>
                <div class="el-strikes">
                  ${strikes.map(alive => `<span class="shield-icon ${alive ? 'alive' : 'lost'}">${alive ? '🛡️' : '💥'}</span>`).join('')}
                </div>
                <div class="el-survived">Survived: <strong>${p.roundsSurvived}</strong></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 9. Render Bob's 27 World Standard Double Practice Scoreboard
  renderBobs27(game) {
    if (!this.container || !game) return;
    const active = game.getActivePlayer();
    const target = game.getCurrentTarget ? game.getCurrentTarget() : { label: 'D1', value: 2, number: 1 };
    const isVisitDone = game.turnDarts && game.turnDarts.length >= 3;
    const nextPlayer = game.getNextPlayer ? game.getNextPlayer() : active;

    let html = `
      <div class="scoreboard-bobs27">
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">Round: <strong>${game.currentRound} / 21</strong></span>
          </div>

          <div class="bobs-target-hero-banner" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 14px; margin: 12px 0; text-align: center;">
            <span class="score-sub-label" style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">ACTIVE TARGET DOUBLE</span>
            <div class="bobs-target-huge" style="font-size: 2.5rem; font-weight: 900; color: var(--accent-gold); margin: 4px 0;">${target.label}</div>
            <span class="target-pts-sub" style="font-size: 0.9rem; color: var(--text-muted);">Hit: <strong style="color:#10b981;">+${target.value} pts</strong> each • 0 Hits: <strong style="color:#ef4444;">-${target.value} pts</strong></span>
          </div>

          <div class="hero-score-display" style="text-align: center; margin: 12px 0;">
            <span class="score-sub-label" style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">CURRENT SCORE</span>
            <div class="main-score-huge" style="font-size: 3.5rem; font-weight: 900; color: ${active.score <= 10 ? '#ef4444' : 'var(--text-primary)'}; line-height: 1;">
              ${active.isEliminated ? '☠️ 0' : active.score}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">
              Doubles Hit: <strong>${active.totalDoublesHit || 0}</strong> • Round Hits: <strong>${active.hitsThisRound || 0} / 3</strong>
            </div>
          </div>

          <!-- 3-Dart Slots -->
          <div class="turn-breakdown-box" style="margin-top: 12px;">
            <div class="turn-box-title" style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-bottom: 6px;">
              VISIT DARTS (3 Darts at ${target.label}):
            </div>
            <div class="hero-turn-darts" style="display: flex; justify-content: center; gap: 8px;">
              <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
            </div>
          </div>

          ${isVisitDone && !game.isMatchOver ? `
            <div class="next-player-prompt-banner" style="margin-top: 14px;">
              <button id="btn-scoreboard-next-player" class="btn-primary-start" type="button" style="width: 100%; padding: 12px; font-weight: 700; font-size: 1rem;">
                ➔ NEXT ${game.players.length > 1 ? `PLAYER (${nextPlayer.name})` : 'ROUND ➔'}
              </button>
            </div>
          ` : ''}
          
        </div>

        ${game.players.length > 1 ? `
          <div class="multiplayer-strip-container" style="margin-top: 14px;">
            <div class="strip-header-label" style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; margin-bottom: 6px;">ALL PLAYERS STANDINGS</div>
            <div class="multiplayer-strip" style="display: flex; gap: 8px; overflow-x: auto;">
              ${game.players.map((p, i) => `
                <div class="player-mini-card ${i === game.activePlayerIndex ? 'is-active' : ''} ${p.isEliminated ? 'eliminated-player' : ''}" style="flex: 1; min-width: 100px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 8px; text-align: center;">
                  <div class="mini-name" style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</div>
                  <div class="mini-score" style="font-size: 1.2rem; font-weight: 800; color: ${p.isEliminated ? '#ef4444' : 'var(--accent-gold)'}; margin: 2px 0;">${p.isEliminated ? '☠️ OUT' : p.score}</div>
                  <div class="mini-avg-badge" style="font-size: 0.75rem; color: var(--text-muted);">${p.totalDoublesHit || 0} Doubles</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.container.innerHTML = html;
  }

  renderAroundClock(game) {
    const active = game.getActivePlayer();

    let html = `
      <div class="scoreboard-clock">
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">Total Darts: <strong>${active.totalDarts}</strong></span>
          </div>

          <div class="clock-hero-target">
            <span class="score-sub-label">TARGET NUMBER</span>
            <div class="clock-big-num">${active.currentTarget === 25 ? 'BULLSEYE 🎯' : active.currentTarget}</div>
            <div class="clock-progress-bar-container">
              <div class="clock-fill-bar" style="width: ${Math.min(100, (active.currentTarget / 21) * 100)}%"></div>
            </div>
          </div>

          <div class="hero-turn-darts" style="justify-content:center; margin-top:12px;">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
          
        </div>

        <div class="multiplayer-strip-container" style="margin-top:14px;">
          <div class="strip-header-label">ALL PLAYERS STANDINGS</div>
          <div class="multiplayer-strip">
            ${game.players.map((p, i) => `
              <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
                <div class="mini-name">${p.name}</div>
                <div class="mini-score">Aiming: ${p.currentTarget === 25 ? 'Bull' : p.currentTarget}</div>
                <div class="mini-avg-badge">Darts: ${p.totalDarts}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }
}
