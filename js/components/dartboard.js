// Interactive SVG Dartboard Component for BullSheet
export class Dartboard {
  constructor(containerEl, onHitCallback) {
    this.container = containerEl;
    this.onHit = onHitCallback;
    this.order = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    this.svg = null;
    this.hits = [];
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    const size = 440;
    const center = size / 2;
    const rBull = 9;
    const rOuterBull = 22;
    const rInnerSingle = 85;
    const rTreble = 98;
    const rOuterSingle = 145;
    const rDouble = 158;
    const rOuterBoard = 205;

    let svgHtml = `
      <svg id="svg-dartboard" viewBox="0 0 ${size} ${size}" class="dartboard-svg" role="img" aria-label="Interactive Dartboard">
        <defs>
          <radialGradient id="board-rim-grad" cx="50%" cy="50%" r="50%">
            <stop offset="70%" stop-color="#0c0e12" />
            <stop offset="100%" stop-color="#1e2229" />
          </radialGradient>
          <filter id="hit-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Board Catch Ring / Background (Miss) -->
        <circle cx="${center}" cy="${center}" r="${rOuterBoard}" class="board-catch-ring" data-score="0" data-mult="0" data-label="Miss" />
    `;

    // 20 segment angles (each segment is 18 degrees, rotated so 20 is at top: -99 to -81 deg)
    const degPerSeg = 18;
    const startOffset = -90 - degPerSeg / 2;

    this.order.forEach((num, index) => {
      const angleStart = (startOffset + index * degPerSeg) * (Math.PI / 180);
      const angleEnd = (startOffset + (index + 1) * degPerSeg) * (Math.PI / 180);

      const isEven = index % 2 === 0;
      const singleColorClass = isEven ? 'seg-black' : 'seg-cream';
      const ringColorClass = isEven ? 'seg-red' : 'seg-green';

      // Helper function to build SVG arc path
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
      svgHtml += `
        <path d="${buildArc(rOuterSingle, rDouble)}" class="board-segment ${ringColorClass} seg-double" 
              data-score="${num * 2}" data-num="${num}" data-mult="2" data-label="D${num}" />
      `;

      // 2. Outer Single
      svgHtml += `
        <path d="${buildArc(rTreble, rOuterSingle)}" class="board-segment ${singleColorClass} seg-single" 
              data-score="${num}" data-num="${num}" data-mult="1" data-label="S${num}" />
      `;

      // 3. Treble Ring
      svgHtml += `
        <path d="${buildArc(rInnerSingle, rTreble)}" class="board-segment ${ringColorClass} seg-treble" 
              data-score="${num * 3}" data-num="${num}" data-mult="3" data-label="T${num}" />
      `;

      // 4. Inner Single
      svgHtml += `
        <path d="${buildArc(rOuterBull, rInnerSingle)}" class="board-segment ${singleColorClass} seg-single" 
              data-score="${num}" data-num="${num}" data-mult="1" data-label="S${num}" />
      `;

      // 5. Wire Numbers
      const midAngle = (startOffset + (index + 0.5) * degPerSeg) * (Math.PI / 180);
      const textR = rOuterBoard - 24;
      const tx = center + textR * Math.cos(midAngle);
      const ty = center + textR * Math.sin(midAngle) + 5;

      svgHtml += `
        <text x="${tx}" y="${ty}" class="board-number-text" text-anchor="middle" font-size="16" font-weight="700">${num}</text>
      `;
    });

    // Outer Bull (25)
    svgHtml += `
      <circle cx="${center}" cy="${center}" r="${rOuterBull}" class="board-segment seg-green seg-bull-outer" 
              data-score="25" data-num="25" data-mult="1" data-label="25" />
    `;

    // Bullseye (50 / Double 25)
    svgHtml += `
      <circle cx="${center}" cy="${center}" r="${rBull}" class="board-segment seg-red seg-bull-inner" 
              data-score="50" data-num="25" data-mult="2" data-label="Bull" />
    `;

    // Hit markers overlay group
    svgHtml += `<g id="dart-hit-markers"></g></svg>`;

    this.container.innerHTML = svgHtml;
    this.svg = this.container.querySelector('#svg-dartboard');
  }

  attachEvents() {
    if (!this.svg) return;

    const handleHit = (e) => {
      const target = e.target.closest('[data-score]');
      if (!target) return;

      const score = parseInt(target.dataset.score, 10);
      const num = parseInt(target.dataset.num || '0', 10);
      const mult = parseInt(target.dataset.mult || '0', 10);
      const label = target.dataset.label || 'Miss';

      // Visual ripple / hit marker at click/touch point
      const rect = this.svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (clientX !== undefined && clientY !== undefined) {
        const svgX = ((clientX - rect.left) / rect.width) * 440;
        const svgY = ((clientY - rect.top) / rect.height) * 440;
        this.addHitMarker(svgX, svgY, label);
      }

      // Flash segment
      target.classList.add('segment-hit-active');
      setTimeout(() => target.classList.remove('segment-hit-active'), 250);

      if (this.onHit) {
        this.onHit({ score, num, mult, label });
      }
    };

    this.svg.addEventListener('click', handleHit);
  }

  addHitMarker(x, y, label) {
    const markersGroup = this.svg.querySelector('#dart-hit-markers');
    if (!markersGroup) return;

    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    marker.setAttribute('class', 'hit-pin-anim');
    marker.innerHTML = `
      <circle cx="${x}" cy="${y}" r="6" fill="#f59e0b" stroke="#ffffff" stroke-width="2" filter="url(#hit-glow)" />
      <circle cx="${x}" cy="${y}" r="14" fill="none" stroke="#f59e0b" stroke-width="1.5" class="hit-ripple" />
    `;
    markersGroup.appendChild(marker);
    this.hits.push(marker);

    // Keep max 3 hit markers on board
    if (this.hits.length > 3) {
      const old = this.hits.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }
  }

  clearHits() {
    const markersGroup = this.svg.querySelector('#dart-hit-markers');
    if (markersGroup) markersGroup.innerHTML = '';
    this.hits = [];
  }
}
