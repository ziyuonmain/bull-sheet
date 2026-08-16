// Dynamic Scoreboard Renderer for BullSheet (Optimized for Oche Visibility & Multi-Player)
export class Scoreboard {
  constructor(containerEl) {
    this.container = containerEl;
  }

  // 1. Render X01 Scoreboard
  renderX01(game) {
    const active = game.getActivePlayer();
    const checkout = game.getCheckout(active.score, 3 - game.turnDarts.length);

    let html = `
      <div class="scoreboard-x01">
        <!-- Main Active Player Hero Display -->
        <div class="hero-player-card">
          <div class="hero-header">
            <div class="hero-player-name">
              <span class="active-badge">THROWING</span>
              <h2>${active.name} ${active.isBot ? '<span class="bot-badge">BOT</span>' : ''}</h2>
            </div>
            <div class="hero-legs-sets">
              <span class="pill-stat">Sets: <strong>${active.setsWon}</strong></span>
              <span class="pill-stat">Legs: <strong>${active.legsWon}</strong></span>
            </div>
          </div>

          <div class="hero-score-row">
            <div class="hero-big-score" id="hero-score-val">${active.score}</div>
            
            <div class="hero-turn-darts">
              <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}">${game.turnDarts[0]?.label || '—'}</div>
              <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}">${game.turnDarts[1]?.label || '—'}</div>
              <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}">${game.turnDarts[2]?.label || '—'}</div>
            </div>
          </div>

          <!-- Checkout / Strategy Banner -->
          <div class="checkout-banner ${checkout ? 'has-checkout' : 'no-checkout'}">
            <span class="checkout-label">CHECKOUT:</span>
            <span class="checkout-route">${checkout ? checkout.join(' → ') : (active.score <= 170 ? 'No checkout available' : 'Setup target: T20')}</span>
          </div>

          <!-- Quick Live Stats Bar -->
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
              <span class="stat-label">High Turn</span>
              <span class="stat-val">${active.highTurn || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">180s</span>
              <span class="stat-val">${active.count180}</span>
            </div>
          </div>
        </div>

        <!-- Multi-Player Comparison Strip (All players in match) -->
        <div class="multiplayer-strip">
          ${game.players.map((p, i) => `
            <div class="player-mini-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
              <div class="mini-card-header">
                <span class="mini-name">${p.name}</span>
                <span class="mini-legs">L: ${p.legsWon} / S: ${p.setsWon}</span>
              </div>
              <div class="mini-score">${p.score}</div>
              <div class="mini-avg">Avg: ${game.getPlayerAvg(p)}</div>
            </div>
          `).join('')}
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
        <!-- Active Turn Header -->
        <div class="cricket-active-bar">
          <div class="active-info">
            <span class="active-badge">THROWING</span>
            <h3>${active.name} ${active.isBot ? '<small>(BOT)</small>' : ''}</h3>
          </div>
          <div class="cricket-turn-darts">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}">${game.turnDarts[0]?.label || '—'}</div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}">${game.turnDarts[1]?.label || '—'}</div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}">${game.turnDarts[2]?.label || '—'}</div>
          </div>
        </div>

        <!-- Cricket Matrix Table -->
        <div class="cricket-table-wrapper">
          <table class="cricket-table">
            <thead>
              <tr>
                ${game.players.map((p, i) => `
                  <th class="${i === game.activePlayerIdx ? 'active-col' : ''}">
                    <div class="th-name">${p.name}</div>
                    <div class="th-score">${p.score} pts</div>
                    <div class="th-mpr">MPR: ${game.getPlayerMPR(p)}</div>
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

  // 3. Render Killer Scoreboard
  renderKiller(game) {
    const active = game.getActivePlayer();

    let html = `
      <div class="scoreboard-killer">
        <div class="killer-header-bar">
          <div class="active-info">
            <span class="active-badge">THROWING</span>
            <h3>${active.name} ${active.isKiller ? '<span class="killer-badge">🔪 KILLER</span>' : '<span class="status-qualifying">Target: D' + active.targetNumber + ' to Qualify</span>'}</h3>
          </div>
          <div class="turn-darts-mini">
            <div class="dart-slot ${game.turnDarts[0] ? 'filled' : ''}">${game.turnDarts[0]?.label || '—'}</div>
            <div class="dart-slot ${game.turnDarts[1] ? 'filled' : ''}">${game.turnDarts[1]?.label || '—'}</div>
            <div class="dart-slot ${game.turnDarts[2] ? 'filled' : ''}">${game.turnDarts[2]?.label || '—'}</div>
          </div>
        </div>

        <div class="killer-grid">
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

  // 4. Render Split Score (Halve-It) Scoreboard
  renderSplitScore(game) {
    const active = game.getActivePlayer();
    const round = game.getCurrentRound();

    let html = `
      <div class="scoreboard-split">
        <div class="split-round-banner">
          <span class="round-num">ROUND ${game.currentRoundIdx + 1} OF ${game.rounds.length}</span>
          <div class="active-target-box">TARGET: <strong>${round.label}</strong></div>
          <span class="split-warning">⚠️ Miss all 3 darts = Score CUT IN HALF!</span>
        </div>

        <div class="split-players-grid">
          ${game.players.map((p, i) => `
            <div class="split-player-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
              <div class="sp-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</div>
              <div class="sp-score">${p.score}</div>
              <div class="sp-hits">Hits this round: <strong>${i === game.activePlayerIdx ? p.hitsThisRound : (p.roundScores[game.currentRoundIdx] !== undefined ? 'Done' : '—')}</strong></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 5. Render Shanghai Scoreboard
  renderShanghai(game) {
    const active = game.getActivePlayer();

    let html = `
      <div class="scoreboard-shanghai">
        <div class="shanghai-banner">
          <span class="round-num">ROUND ${game.currentRound} OF ${game.maxRounds}</span>
          <div class="active-target-box">TARGET: <strong>${game.currentRound}</strong></div>
          <span class="shanghai-tip">🔥 Hit S, D, and T of #${game.currentRound} in one turn for INSTANT WIN!</span>
        </div>

        <div class="shanghai-players-grid">
          ${game.players.map((p, i) => `
            <div class="shanghai-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
              <div class="sh-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</div>
              <div class="sh-score">${p.score} <small>pts</small></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 6. Render Elimination (Knockout) Scoreboard
  renderElimination(game) {
    const active = game.getActivePlayer();

    let html = `
      <div class="scoreboard-elimination">
        <div class="elim-target-banner">
          <span class="target-title">SCORE TO BEAT:</span>
          <div class="target-number-large">${game.targetScoreToBeat}</div>
          <span class="target-by">${game.targetSetByPlayer ? `Set by ${game.targetSetByPlayer}` : 'First player sets the target!'}</span>
        </div>

        <div class="elim-players-grid">
          ${game.players.map((p, i) => {
            const strikes = Array.from({ length: game.startingLives }, (_, idx) => idx < p.lives);
            return `
              <div class="elim-card ${i === game.activePlayerIdx ? 'is-active' : ''} ${p.isEliminated ? 'is-eliminated' : ''}">
                <div class="el-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</div>
                <div class="el-status">${p.isEliminated ? '☠️ OUT' : '🛡️ SURVIVING'}</div>
                <div class="el-strikes">
                  ${strikes.map(alive => `<span class="shield-icon ${alive ? 'alive' : 'lost'}">${alive ? '🛡️' : '💥'}</span>`).join('')}
                </div>
                <div class="el-survived">Rounds Survived: ${p.roundsSurvived}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  // 7. Render Around the Clock Scoreboard
  renderAroundClock(game) {
    const active = game.getActivePlayer();

    let html = `
      <div class="scoreboard-clock">
        <div class="clock-hero-box">
          <span class="clock-label">CURRENT TARGET:</span>
          <div class="clock-target-num">${active.currentTarget === 25 ? 'BULLSEYE 🎯' : active.currentTarget}</div>
          <div class="clock-progress-bar">
            <div class="clock-fill" style="width: ${Math.min(100, (active.currentTarget / 21) * 100)}%"></div>
          </div>
        </div>

        <div class="clock-players-grid">
          ${game.players.map((p, i) => `
            <div class="clock-card ${i === game.activePlayerIdx ? 'is-active' : ''}">
              <div class="ck-name">${p.name} ${p.isBot ? '<small>(BOT)</small>' : ''}</div>
              <div class="ck-target">Aiming: <strong>${p.currentTarget === 25 ? 'Bull' : p.currentTarget}</strong></div>
              <div class="ck-darts">Darts: ${p.totalDarts}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }
}
