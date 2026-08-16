// Interactive SVG Dartboard Component for BullSheet with Right-Half Unified Action Controls
export class Dartboard {
  constructor(containerEl, onHitCallback, onUndoCallback, onNextPlayerCallback) {
    this.container = containerEl;
    this.onHit = onHitCallback;
    this.onUndo = onUndoCallback;
    this.onNextPlayer = onNextPlayerCallback;
    this.order = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    this.svg = null;
    this.hits = [];
    this.isVisitComplete = false;
    this.nextPlayerName = '';
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  updateState(game) {
    if (!game) return;
    this.isVisitComplete = game.turnDarts && game.turnDarts.length >= 3 && !game.isMatchOver;
    const nextP = game.getNextPlayer ? game.getNextPlayer() : null;
    this.nextPlayerName = nextP ? nextP.name : '';

    const nextBtn = this.container.querySelector('#btn-dartboard-next');
    if (nextBtn) {
      if (this.isVisitComplete) {
        nextBtn.classList.remove('hidden-action');
        nextBtn.classList.add('active-pulse');
        nextBtn.innerHTML = `<span>➔ NEXT PLAYER (${this.nextPlayerName})</span>`;
      } else {
        nextBtn.classList.add('hidden-action');
        nextBtn.classList.remove('active-pulse');
      }
    }
  }

  render() {
    const size = 440;
    const center = size / 2;
    const rBull = 10;
    const rOuterBull = 24;
    const rInnerSingle = 85;
    const rTreble = 98;
    const rOuterSingle = 145;
    const rDouble = 158;
    const rOuterBoard = 205;

    let html = `
      <!-- Right-Half Primary Action Bar (UNDO • MISS • NEXT PLAYER) -->
      <div class="right-actions-top-bar" style="margin-bottom: 8px;">
        <button class="btn-panel-action btn-action-undo" type="button" id="btn-dartboard-undo" title="Undo Last Dart">
          <span>↶ UNDO</span>
        </button>
        <button class="btn-panel-action btn-action-miss" type="button" id="btn-dartboard-miss" title="Record Miss (0 pts)">
          <span>❌ MISS (0)</span>
        </button>
        <button class="btn-panel-action btn-action-next hidden-action" type="button" id="btn-dartboard-next" title="Advance Turn">
          <span>➔ NEXT PLAYER</span>
        </button>
      </div>

      <svg id="svg-dartboard" viewBox="0 0 ${size} ${size}" class="dartboard-svg" role="img" aria-label="Interactive Dartboard">
        <defs>
          <filter id="hit-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Board Catch Ring / Background (Miss) -->
        <circle cx="${center}" cy="${center}" r="${rOuterBoard}" class="board-catch-ring" data-score="0" data-num="0" data-mult="0" data-label="Miss" />
    `;

    const degPerSeg = 18;
    const startOffset = -90 - degPerSeg / 2;

    this.order.forEach((num, index) => {
      const angleStart = (startOffset + index * degPerSeg) * (Math.PI / 180);
      const angleEnd = (startOffset + (index + 1) * degPerSeg) * (Math.PI / 180);

      const isEven = index % 2 === 0;
      const singleColorClass = isEven ? 'seg-black' : 'seg-cream';
      const ringColorClass = isEven ? 'seg-red' : 'seg-green';

      const buildArc = (rIn, rOut) => {
        const x1 = center + rOut * Math.cos(angleStart);
        const y1 = center + rOut * Math.sin(angleStart);
        const x2 = center + rOut * Math.cos(angleEnd);
        const y2 = center + rOut * Math.sin(angleEnd);
        const x3 = center + rIn * Math.cos(angleEnd);
        const y3 = center + rIn * Math.sin(angleEnd);
        const x4 = center + rIn * Math.cos(angleStart);
        const y4 = center + rIn * Math.sin(angleStart);

        return `M ${x1} ${y1} A ${rOut} ${rOut} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 0 0 ${x4} ${y4} Z`;
      };

      // 1. Double Ring
      html += `
        <path d="${buildArc(rOuterSingle, rDouble)}" class="board-segment ${ringColorClass} seg-double seg-num-${num}" 
              data-score="${num * 2}" data-num="${num}" data-mult="2" data-label="D${num}" />
      `;

      // 2. Outer Single
      html += `
        <path d="${buildArc(rTreble, rOuterSingle)}" class="board-segment ${singleColorClass} seg-single seg-num-${num}" 
              data-score="${num}" data-num="${num}" data-mult="1" data-label="S${num}" />
      `;

      // 3. Treble Ring
      html += `
        <path d="${buildArc(rInnerSingle, rTreble)}" class="board-segment ${ringColorClass} seg-treble seg-num-${num}" 
              data-score="${num * 3}" data-num="${num}" data-mult="3" data-label="T${num}" />
      `;

      // 4. Inner Single
      html += `
        <path d="${buildArc(rOuterBull, rInnerSingle)}" class="board-segment ${singleColorClass} seg-single seg-num-${num}" 
              data-score="${num}" data-num="${num}" data-mult="1" data-label="S${num}" />
      `;

      // 5. Wire Numbers
      const midAngle = (startOffset + (index + 0.5) * degPerSeg) * (Math.PI / 180);
      const textR = rOuterBoard - 24;
      const tx = center + textR * Math.cos(midAngle);
      const ty = center + textR * Math.sin(midAngle) + 5;

      html += `
        <text x="${tx}" y="${ty}" class="board-number-text" text-anchor="middle" font-size="16" font-weight="700">${num}</text>
      `;
    });

    // Outer Bull (25)
    html += `
      <circle cx="${center}" cy="${center}" r="${rOuterBull}" class="board-segment seg-green seg-bull-outer seg-num-25" 
              data-score="25" data-num="25" data-mult="1" data-label="25" />
    `;

    // Bullseye (50 / Double 25)
    html += `
      <circle cx="${center}" cy="${center}" r="${rBull}" class="board-segment seg-red seg-bull-inner seg-num-25" 
              data-score="50" data-num="25" data-mult="2" data-label="Bull" />
    `;

    // Hit markers overlay group
    html += `<g id="dart-hit-markers" style="pointer-events: none;"></g></svg>`;

    this.container.innerHTML = html;
    this.svg = this.container.querySelector('#svg-dartboard');
  }

  attachEvents() {
    // Top Right Action Buttons: Undo, Miss & Next Player
    this.container.querySelector('#btn-dartboard-undo')?.addEventListener('click', () => {
      if (this.onUndo) this.onUndo();
    });

    this.container.querySelector('#btn-dartboard-miss')?.addEventListener('click', () => {
      if (this.onHit) {
        this.onHit({ score: 0, number: 0, mult: 0, label: 'Miss' });
      }
    });

    this.container.querySelector('#btn-dartboard-next')?.addEventListener('click', () => {
      if (this.onNextPlayer) this.onNextPlayer();
    });

    if (!this.svg) return;

    const handleHit = (e) => {
      const target = e.target.closest('.board-segment, .board-catch-ring');
      if (!target) return;

      const score = parseInt(target.dataset.score, 10) || 0;
      const num = parseInt(target.dataset.num, 10) || 0;
      const mult = parseInt(target.dataset.mult, 10) || 0;
      const label = target.dataset.label || 'Miss';

      // Visual ripple
      const rect = this.svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (clientX !== undefined && clientY !== undefined) {
        const svgX = ((clientX - rect.left) / rect.width) * 440;
        const svgY = ((clientY - rect.top) / rect.height) * 440;
        this.addHitMarker(svgX, svgY, label);
      }

      target.classList.add('segment-hit-active');
      setTimeout(() => target.classList.remove('segment-hit-active'), 250);

      if (this.onHit) {
        this.onHit({ score, number: num, mult, label });
      }
    };

    this.svg.addEventListener('click', handleHit);
  }

  addHitMarker(x, y, label) {
    const markersGroup = this.svg.querySelector('#dart-hit-markers');
    if (!markersGroup) return;

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    marker.setAttribute('class', 'hit-pin-anim');
    marker.style.pointerEvents = 'none';
    marker.innerHTML = `
      <circle cx="${x}" cy="${y}" r="6" fill="#f59e0b" stroke="#ffffff" stroke-width="2" filter="url(#hit-glow)" />
      <circle cx="${x}" cy="${y}" r="14" fill="none" stroke="#f59e0b" stroke-width="1.5" class="hit-ripple" />
    `;
    markersGroup.appendChild(marker);
    this.hits.push(marker);

    if (this.hits.length > 3) {
      const old = this.hits.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }
  }

  highlightTarget(targetInfo) {
    if (!this.svg) return;
    this.clearHighlights();

    if (!targetInfo) return;

    if (typeof targetInfo === 'string') {
      this.highlightSegmentByLabel(targetInfo, 'target-highlight-active');
      return;
    }

    if (targetInfo.type === 'num') {
      this.svg.querySelectorAll(`.seg-num-${targetInfo.value}`).forEach(el => {
        el.classList.add('target-highlight-active');
      });
    } else if (targetInfo.type === 'double') {
      this.svg.querySelectorAll('.seg-double, .seg-bull-inner').forEach(el => {
        el.classList.add('target-highlight-active');
      });
    } else if (targetInfo.type === 'treble') {
      this.svg.querySelectorAll('.seg-treble').forEach(el => {
        el.classList.add('target-highlight-active');
      });
    } else if (targetInfo.type === 'bull') {
      this.svg.querySelectorAll('.seg-num-25').forEach(el => {
        el.classList.add('target-highlight-active');
      });
    }
  }

  highlightCheckout(route, activeStepIdx = 0) {
    if (!this.svg) return;
    this.clearHighlights();

    if (!route || route.length === 0) return;

    route.forEach((token, idx) => {
      if (idx === activeStepIdx) {
        this.highlightSegmentByLabel(token, 'target-highlight-active');
      } else if (idx > activeStepIdx) {
        this.highlightSegmentByLabel(token, 'target-highlight-secondary');
      }
    });
  }

  highlightSegmentByLabel(token, cssClass = 'target-highlight-active') {
    if (!this.svg || !token) return;
    const cleanToken = token.trim().toUpperCase();

    if (cleanToken === 'BULL' || cleanToken === 'BULLSEYE' || cleanToken === 'D25' || cleanToken === '50') {
      this.svg.querySelector('.seg-bull-inner')?.classList.add(cssClass);
      return;
    }

    if (cleanToken === '25' || cleanToken === 'S25' || cleanToken === 'OUTER' || cleanToken === 'OUTER BULL') {
      this.svg.querySelector('.seg-bull-outer')?.classList.add(cssClass);
      return;
    }

    if (cleanToken.startsWith('T')) {
      const num = cleanToken.slice(1);
      this.svg.querySelectorAll(`.seg-treble.seg-num-${num}`).forEach(el => el.classList.add(cssClass));
      return;
    }

    if (cleanToken.startsWith('D')) {
      const num = cleanToken.slice(1);
      this.svg.querySelectorAll(`.seg-double.seg-num-${num}`).forEach(el => el.classList.add(cssClass));
      return;
    }

    if (cleanToken.startsWith('S')) {
      const num = cleanToken.slice(1);
      this.svg.querySelectorAll(`.seg-single.seg-num-${num}`).forEach(el => el.classList.add(cssClass));
      return;
    }

    const num = parseInt(cleanToken, 10);
    if (!isNaN(num)) {
      this.svg.querySelectorAll(`.seg-single.seg-num-${num}`).forEach(el => el.classList.add(cssClass));
    }
  }

  clearHighlights() {
    if (!this.svg) return;
    this.svg.querySelectorAll('.target-highlight-active, .target-highlight-secondary').forEach(el => {
      el.classList.remove('target-highlight-active', 'target-highlight-secondary');
    });
  }

  clearHits() {
    const markersGroup = this.svg.querySelector('#dart-hit-markers');
    if (markersGroup) markersGroup.innerHTML = '';
    this.hits = [];
  }
}
