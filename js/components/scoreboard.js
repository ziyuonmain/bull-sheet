// Ultra High-Visibility & Intuitive Scoreboard Renderer for BullSheet
export class Scoreboard {
  renderNextPlayerBanner(game) {
    if (!game || !game.turnDarts || game.turnDarts.length < 3 || game.isMatchOver) return '';
    return `
      <div class="next-player-banner">
        <button id="btn-scoreboard-next-player" class="btn-advance-turn-prominent" type="button">
          <span class="btn-next-main-text">End Turn ➔</span>
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
    const isLocked = game.isEntryLocked ? game.isEntryLocked(active) : (game.inMode !== 'straight' && !active.hasDoubledIn);
    const dartsLeft = 3 - game.turnDarts.length;
    const checkout = !isLocked ? game.getCheckout(active.score, dartsLeft) : null;
    const turnTotal = game.turnDarts.reduce((acc, d) => acc + (d.effectiveScore !== undefined ? d.effectiveScore : (d.score || 0)), 0);

    const inModeLabel = game.inMode === 'master' ? 'MASTER IN' : 'DOUBLE IN';

    let html = `
      <div class="scoreboard-x01">
        <!-- Giant Active Player Turn Card -->
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
              ${isLocked ? `<span class="hero-lock-badge">🔒 ${inModeLabel}</span>` : ''}
            </div>
            <div class="hero-legs-sets">
              <span class="pill-stat">Set <strong>${active.setsWon}</strong></span>
              <span class="pill-stat highlight-legs">Legs <strong>${active.legsWon}</strong></span>
            </div>
          </div>

          <!-- Main Giant Score -->
          <div class="hero-score-row">
            <div class="score-display-block">
              <div class="hero-big-score" id="hero-score-val">${active.score}</div>
            </div>
            
            <!-- Live Turn Progress Breakdown -->
            <div class="turn-breakdown-box">
              <div class="turn-box-title">THIS TURN: <strong class="turn-sum-val">+${turnTotal}</strong></div>
              <div class="hero-turn-darts">
                <div class="dart-slot ${game.turnDarts[0] ? (game.turnDarts[0].lockedMiss ? 'filled-locked' : (game.turnDarts[0].justOpened ? 'filled-opened' : 'filled')) : ''}">
                  <span class="dart-slot-num">1</span>
                  <strong class="dart-slot-val">${game.turnDarts[0] ? (game.turnDarts[0].lockedMiss ? `${game.turnDarts[0].label} (0)` : (game.turnDarts[0].label || '—')) : '—'}</strong>
                </div>
                <div class="dart-slot ${game.turnDarts[1] ? (game.turnDarts[1].lockedMiss ? 'filled-locked' : (game.turnDarts[1].justOpened ? 'filled-opened' : 'filled')) : ''}">
                  <span class="dart-slot-num">2</span>
                  <strong class="dart-slot-val">${game.turnDarts[1] ? (game.turnDarts[1].lockedMiss ? `${game.turnDarts[1].label} (0)` : (game.turnDarts[1].label || '—')) : '—'}</strong>
                </div>
                <div class="dart-slot ${game.turnDarts[2] ? (game.turnDarts[2].lockedMiss ? 'filled-locked' : (game.turnDarts[2].justOpened ? 'filled-opened' : 'filled')) : ''}">
                  <span class="dart-slot-num">3</span>
                  <strong class="dart-slot-val">${game.turnDarts[2] ? (game.turnDarts[2].lockedMiss ? `${game.turnDarts[2].label} (0)` : (game.turnDarts[2].label || '—')) : '—'}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Clean Checkout / Entry Guidance Pill -->
          ${isLocked ? `
            <div class="checkout-pill-bar in-mode-entry-bar">
              <span class="checkout-pill-tag tag-double-in">ENTRY</span>
              <span class="checkout-pill-route">${game.inMode === 'master' ? '🎯 Aim any Double or Treble to open score' : '🎯 Aim any Double (or D-Bull) to open score'}</span>
            </div>
          ` : `
            <div class="checkout-pill-bar ${checkout ? 'has-checkout' : 'no-checkout'}">
              <span class="checkout-pill-tag">${checkout ? 'FINISH' : 'SETUP'}</span>
              <span class="checkout-pill-route">${checkout ? checkout.join(' • ') : (active.score <= 170 ? 'Bogey number — set up a double' : 'Aim Treble 20')}</span>
            </div>
          `}

          <!-- Live Player Statistics Bar -->
          <div class="hero-stats-bar">
            <div class="stat-item">
              <span class="stat-label">3-Dart Avg</span>
              <span class="stat-val">${game.getPlayerAvg(active)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">First 9 Avg</span>
              <span class="stat-val">${game.getFirst9Avg(active)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Best Turn</span>
              <span class="stat-val">${active.highTurn || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">180s Hit</span>
              <span class="stat-val highlight-180">${active.count180}</span>
            </div>
          </div>

          ${this.renderNextPlayerBanner(game)}
        </div>

        <!-- Multiplayer Standings Strip -->
        <div class="multiplayer-strip-container">
          <div class="strip-header-label">ALL PLAYERS STANDINGS ${game.inMode !== 'straight' ? `• <span style="color:var(--accent-gold); font-weight:800;">${inModeLabel}</span>` : ''}</div>
          <div class="multiplayer-strip">
            ${game.players.map((p, i) => {
              const pLocked = game.inMode !== 'straight' && !p.hasDoubledIn;
              return `
                <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''} ${pLocked ? 'mini-card-locked' : ''}">
                  <div class="mini-card-header">
                    <span class="mini-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</span>
                    <span class="mini-legs">L: ${p.legsWon} | S: ${p.setsWon}</span>
                  </div>
                  <div class="mini-score">${p.score}</div>
                  <div class="mini-footer-row">
                    <div class="mini-avg-badge">Avg: ${game.getPlayerAvg(p)}</div>
                    ${game.inMode !== 'straight' ? `
                      <span class="mini-in-tag ${pLocked ? 'tag-locked' : 'tag-open'}">${pLocked ? '🔒 Locked' : '✓ In'}</span>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
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
          ${this.renderNextPlayerBanner(game)}
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
          ${this.renderNextPlayerBanner(game)}
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
    const targetLabel = target === 25 ? '🎯 BULL' : target;

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

          <div class="shooter-target-hero-banner">
            <div class="shooter-target-badge">🏹 TARGET</div>
            <div class="shooter-target-huge">${targetLabel}</div>
            <span class="shooter-target-sub">Single: +1 Hit • Double: +2 Hits • Treble: +3 Hits</span>
          </div>

          <div class="hero-turn-darts" style="justify-content:center; margin-top:12px;">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
          ${this.renderNextPlayerBanner(game)}
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
    const aliveOpponents = game.players.filter(p => !p.isEliminated && p.id !== active.id);

    let html = `
      <div class="scoreboard-killer">
        <!-- Giant Active Player Turn Card -->
        <div class="hero-player-card ${active.isKiller ? 'is-killer-hero' : ''}">
          <div class="hero-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="hero-player-name" style="display: flex; align-items: center; gap: 8px;">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
              <span class="killer-status-badge ${active.isKiller ? 'status-killer' : 'status-qualifying'}">
                ${active.isKiller ? '🔪 ACTIVE KILLER' : `🔒 QUALIFY: D${active.targetNumber}`}
              </span>
            </div>
            <div class="killer-lives-pill">
              <span class="lives-hearts-display">
                ${'❤️'.repeat(active.lives)}${'🖤'.repeat(Math.max(0, game.startingLives - active.lives))}
              </span>
              <span class="lives-count-text"><strong>${active.lives}</strong> / ${game.startingLives} Lives</span>
            </div>
          </div>

          <!-- Mission / Target Guidance Card -->
          <div class="killer-mission-bar ${active.isKiller ? 'mission-hunting' : 'mission-qualifying'}">
            <div class="killer-mission-header">
              <span class="mission-tag">${active.isKiller ? '🎯 HUNTING PHASE' : '🔒 QUALIFICATION PHASE'}</span>
              <span class="mission-title">${active.isKiller ? 'ELIMINATE OPPONENTS' : `HIT DOUBLE ${active.targetNumber}`}</span>
            </div>
            
            ${active.isKiller ? `
              <div class="killer-hunt-targets">
                ${aliveOpponents.map(opp => `
                  <div class="hunt-target-chip">
                    <span class="hunt-opp-name">${opp.name}</span>
                    <strong class="hunt-opp-target">D${opp.targetNumber}</strong>
                    <span class="hunt-opp-lives">${'❤️'.repeat(opp.lives)}</span>
                  </div>
                `).join('')}
              </div>
              <div class="killer-mission-sub">Hit any opponent's double to steal their lives!</div>
            ` : `
              <div class="killer-qualify-target-huge">
                <span class="target-prefix">YOUR TARGET:</span> <strong>D${active.targetNumber}</strong>
              </div>
              <div class="killer-mission-sub">Land on <strong>Double ${active.targetNumber}</strong> to become an active Killer!</div>
            `}
          </div>

          <!-- Turn Darts Slots -->
          <div class="hero-turn-darts" style="justify-content:center; margin-top:14px;">
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
          ${this.renderNextPlayerBanner(game)}
        </div>

        <!-- Standings / Roster Grid -->
        <div class="killer-grid" style="margin-top:14px;">
          ${game.players.map((p, i) => {
            const isActive = i === game.activePlayerIdx;
            return `
              <div class="killer-player-card ${isActive ? 'is-active' : ''} ${p.isEliminated ? 'is-eliminated' : ''} ${p.isKiller ? 'is-killer-player' : ''}">
                <div class="k-card-header">
                  <div class="k-player-identity">
                    <span class="k-name">${p.name} ${p.isBot ? '<small class="bot-badge-small">BOT</small>' : ''}</span>
                  </div>
                  <div class="k-target-pill">
                    <span class="k-target-sub">TARGET</span>
                    <strong class="k-target-num">#${p.targetNumber}</strong>
                  </div>
                </div>
                
                <div class="k-status-row">
                  ${p.isEliminated ? `
                    <span class="k-badge k-badge-dead">☠️ ELIMINATED</span>
                  ` : p.isKiller ? `
                    <span class="k-badge k-badge-active-killer">🔪 KILLER <span class="k-kills-count">(${p.kills} ⚔️)</span></span>
                  ` : `
                    <span class="k-badge k-badge-hunting">🔒 Needs D${p.targetNumber}</span>
                  `}
                </div>

                <div class="k-lives-container">
                  <div class="k-lives-icons">
                    ${Array.from({ length: game.startingLives }, (_, idx) => idx < p.lives ? '<span class="life-pip-alive">❤️</span>' : '<span class="life-pip-lost">🖤</span>').join('')}
                  </div>
                  <div class="k-lives-text">${p.isEliminated ? 'Eliminated' : `${p.lives} / ${game.startingLives} Lives`}</div>
                </div>
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
            <span class="split-target-sublabel">➗ ROUND TARGET</span>
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
          ${this.renderNextPlayerBanner(game)}
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
    const target = game.currentRound;
    const hasSingle = game.turnDarts.some(d => Number(d.number) === target && (Number(d.mult) === 1 || !d.mult));
    const hasDouble = game.turnDarts.some(d => Number(d.number) === target && Number(d.mult) === 2);
    const hasTreble = game.turnDarts.some(d => Number(d.number) === target && Number(d.mult) === 3);

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

          <div class="shanghai-target-hero-banner">
            <div class="shanghai-target-badge">🏮 TARGET NUMBER</div>
            <div class="shanghai-target-huge">${target}</div>
            <div class="shanghai-combo-chips">
              <span class="combo-chip ${hasSingle ? 'hit' : ''}">Single ${hasSingle ? '✓' : ''}</span>
              <span class="combo-chip ${hasDouble ? 'hit' : ''}">Double ${hasDouble ? '✓' : ''}</span>
              <span class="combo-chip ${hasTreble ? 'hit' : ''}">Treble ${hasTreble ? '✓' : ''}</span>
            </div>
            <span class="shanghai-golden-rule">Hit Single + Double + Treble for Instant Win!</span>
          </div>

          <div class="hero-turn-darts" style="justify-content:center; margin-top:12px;">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
          ${this.renderNextPlayerBanner(game)}
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
    const target = game.targetScoreToBeat || 0;
    const isFirstPlayer = target === 0;
    const isBeat = turnTotal > target;

    let html = `
      <div class="scoreboard-elimination">
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-pulse-badge">▶ THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <span class="pill-stat highlight-legs">🛡️ Shields: <strong>${active.lives}</strong></span>
          </div>

          <!-- Hero Target Banner -->
          <div class="party-target-banner elim-target-banner">
            <span class="banner-sublabel">💀 SCORE TO BEAT</span>
            <div class="banner-target-val">${target > 0 ? target : '👑 NEW TARGET'}</div>
            <div class="banner-target-hint">
              ${isFirstPlayer ? 'First player sets the target to beat!' : `Target set by <strong>${game.targetSetByPlayer || 'Leader'}</strong>`}
            </div>
          </div>

          <!-- Visit Scoring Progress -->
          <div class="party-visit-status ${isBeat ? 'status-safe' : (isFirstPlayer ? 'status-setting' : 'status-danger')}">
            ${isFirstPlayer ? 
              `🔥 Throw high to set a difficult target! (Current: <strong>${turnTotal} pts</strong>)` : 
              (isBeat ? 
                `✅ SAFE! Current: <strong>${turnTotal} pts</strong> (Beat ${target}!)` : 
                `⚠️ Current: <strong>${turnTotal} pts</strong> (Need <strong>${target + 1}+</strong> to survive!)`
              )
            }
          </div>

          <!-- 3-Dart Slots -->
          <div class="turn-breakdown-box" style="margin-top: 10px;">
            <div class="hero-turn-darts" style="justify-content: center; gap: 8px;">
              <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
            </div>
          </div>
          ${this.renderNextPlayerBanner(game)}
        </div>

        <!-- Standings Cards Grid -->
        <div class="party-standings-section" style="margin-top: 12px;">
          <div class="strip-header-label">ALL SURVIVORS STANDINGS</div>
          <div class="party-players-grid">
            ${game.players.map((p, i) => {
              const shields = Array.from({ length: game.startingLives }, (_, idx) => idx < p.lives);
              return `
                <div class="party-player-card ${i === game.activePlayerIdx ? 'is-active' : ''} ${p.isEliminated ? 'is-eliminated' : ''}">
                  <div class="party-card-header">
                    <span class="party-pname">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</span>
                    <span class="party-status-tag ${p.isEliminated ? 'tag-out' : 'tag-alive'}">
                      ${p.isEliminated ? '☠️ OUT' : '🛡️ ALIVE'}
                    </span>
                  </div>
                  <div class="party-shields-row">
                    ${shields.map(alive => `<span class="shield-badge ${alive ? 'shield-on' : 'shield-off'}">${alive ? '🛡️' : '💥'}</span>`).join('')}
                  </div>
                  <div class="party-stat-sub">Survived: <strong>${p.roundsSurvived}</strong> rounds</div>
                </div>
              `;
            }).join('')}
          </div>
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
            <div class="bobs-target-huge" style="font-size: 2.5rem; font-weight: 900; color: var(--accent-gold); margin: 4px 0;">${target.label}</div>
            <span class="target-pts-sub" style="font-size: 0.9rem; color: var(--text-muted);">Hit: <strong style="color:#10b981;">+${target.value} pts</strong> each • 0 Hits: <strong style="color:#ef4444;">-${target.value} pts</strong></span>
          </div>

          <div class="hero-score-display" style="text-align: center; margin: 12px 0;">
            <div class="main-score-huge" style="font-size: 3.5rem; font-weight: 900; color: ${active.score <= 10 ? '#ef4444' : 'var(--text-primary)'}; line-height: 1;">
              ${active.isEliminated ? '☠️ 0' : active.score}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">
              Doubles Hit: <strong>${active.totalDoublesHit || 0}</strong> • Round Hits: <strong>${active.hitsThisRound || 0} / 3</strong>
            </div>
          </div>

          <!-- 3-Dart Slots -->
          <div class="turn-breakdown-box" style="margin-top: 12px;">
            <div class="hero-turn-darts" style="display: flex; justify-content: center; gap: 8px;">
              <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
              <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
            </div>
          </div>

          ${this.renderNextPlayerBanner(game)}
        </div>

        ${game.players.length > 1 ? `
          <div class="multiplayer-strip-container" style="margin-top: 14px;">
            <div class="strip-header-label" style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; margin-bottom: 6px;">ALL PLAYERS STANDINGS</div>
            <div class="multiplayer-strip" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(105px, 1fr)); gap: 6px;">
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
            <div class="clock-big-num">${active.currentTarget === 25 ? 'BULLSEYE' : active.currentTarget}</div>
            <div class="clock-progress-bar-container">
              <div class="clock-fill-bar" style="width: ${Math.min(100, (active.currentTarget / 21) * 100)}%"></div>
            </div>
          </div>

          <div class="hero-turn-darts" style="justify-content:center; margin-top:12px;">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[0]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[1]?.label || '—'}</strong></div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}"><strong class="dart-slot-val">${game.turnDarts[2]?.label || '—'}</strong></div>
          </div>
          ${this.renderNextPlayerBanner(game)}
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
