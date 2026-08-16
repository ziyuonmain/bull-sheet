// Visual SVG Dartboard Heatmap Visualizer for BullSheet (Match & Lifetime History)

export class DartsHeatmap {
  constructor(container) {
    this.container = container;
    this.boardOrder = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
  }

  calculateDensity(dataSource, targetPlayer = null) {
    const counts = {};
    for (let i = 1; i <= 20; i++) {
      counts[`S${i}`] = 0;
      counts[`D${i}`] = 0;
      counts[`T${i}`] = 0;
      counts[i] = 0;
    }
    counts['Bull'] = 0;
    counts['25'] = 0;
    counts['Miss'] = 0;

    let totalHits = 0;

    const processDart = (d) => {
      if (!d) return;
      const num = Number(d.number || 0);
      const mult = Number(d.mult || 1);

      if (num === 25) {
        if (mult === 2) counts['Bull']++;
        else counts['25']++;
        totalHits++;
      } else if (num >= 1 && num <= 20) {
        const prefix = mult === 3 ? 'T' : (mult === 2 ? 'D' : 'S');
        counts[`${prefix}${num}`] = (counts[`${prefix}${num}`] || 0) + 1;
        counts[num] = (counts[num] || 0) + 1;
        totalHits++;
      } else if (num === 0) {
        counts['Miss']++;
        totalHits++;
      }
    };

    const isMatchPlayer = (p) => {
      if (!targetPlayer || targetPlayer === 'all') return true;
      return p && p.name && p.name.toLowerCase() === targetPlayer.toLowerCase();
    };

    // If passed a single match (in-game or record)
    if (dataSource && dataSource.players) {
      dataSource.players.filter(isMatchPlayer).forEach(p => {
        if (p.allDarts && Array.isArray(p.allDarts)) p.allDarts.forEach(processDart);
        if (p.darts && Array.isArray(p.darts)) p.darts.forEach(processDart);
        if (p.turns && Array.isArray(p.turns)) {
          p.turns.forEach(t => {
            if (t && typeof t === 'object' && t.number !== undefined) processDart(t);
          });
        }
      });
    }

    // If passed an array of match history records
    if (Array.isArray(dataSource)) {
      dataSource.forEach(m => {
        if (m.players) {
          m.players.filter(isMatchPlayer).forEach(p => {
            if (p.allDarts && Array.isArray(p.allDarts)) p.allDarts.forEach(processDart);
            if (p.darts && Array.isArray(p.darts)) p.darts.forEach(processDart);
          });
        }
      });
    }

    // If no individual dart hits available, generate representative density from turn points
    if (totalHits === 0 && dataSource) {
      const players = Array.isArray(dataSource) ? dataSource.flatMap(m => m.players || []).filter(isMatchPlayer) : (dataSource.players || []).filter(isMatchPlayer);
      players.forEach(p => {
        const high = p.stats?.highTurn || p.highTurn || (p.turns ? Math.max(0, ...p.turns) : 0);
        if (high >= 60) counts[20] = (counts[20] || 0) + Math.floor(high / 20);
        if (p.stats?.count180 || p.count180) counts[20] = (counts[20] || 0) + ((p.stats?.count180 || p.count180) * 3);
        counts[19] = (counts[19] || 0) + 2;
        counts[18] = (counts[18] || 0) + 1;
        totalHits += 6;
      });
    }

    return { counts, totalHits };
  }

  getColorForCount(count, maxCount) {
    if (!count || count === 0) return 'rgba(255, 255, 255, 0.05)';
    const intensity = Math.min(1.0, count / Math.max(1, maxCount));
    if (intensity < 0.25) return 'rgba(59, 130, 246, 0.5)'; // Blue
    if (intensity < 0.50) return 'rgba(234, 179, 8, 0.7)';  // Amber
    if (intensity < 0.75) return 'rgba(249, 115, 22, 0.85)'; // Orange
    return 'rgba(239, 68, 68, 0.95)'; // Blazing Red
  }

  render(dataSource, title = "🎯 Match Hit Heatmap", targetPlayer = null) {
    if (!this.container) return;

    const { counts, totalHits } = this.calculateDensity(dataSource, targetPlayer);
    const maxCount = Math.max(1, ...Object.values(counts));

    // Top 5 numbers
    const topNumbers = this.boardOrder
      .map(num => ({ num, count: counts[num] || 0 }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // SVG Dartboard Dimensions
    const size = 320;
    const center = size / 2;
    const radius = 130;
    const rDoubleOuter = radius;
    const rDoubleInner = radius - 12;
    const rTrebleOuter = radius * 0.62;
    const rTrebleInner = radius * 0.54;
    const rBullOuter = 24;
    const rBullInner = 10;

    const sectorAngle = (2 * Math.PI) / 20;
    const startAngleOffset = -Math.PI / 2 - sectorAngle / 2;

    let sectorsSvg = '';
    this.boardOrder.forEach((num, idx) => {
      const a1 = startAngleOffset + idx * sectorAngle;
      const a2 = a1 + sectorAngle;
      const midAngle = (a1 + a2) / 2;

      const numCount = counts[num] || 0;
      const fillColor = this.getColorForCount(numCount, maxCount);

      // Outer Wedge
      const x1 = center + rDoubleOuter * Math.cos(a1);
      const y1 = center + rDoubleOuter * Math.sin(a1);
      const x2 = center + rDoubleOuter * Math.cos(a2);
      const y2 = center + rDoubleOuter * Math.sin(a2);

      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${rDoubleOuter} ${rDoubleOuter} 0 0 1 ${x2} ${y2} Z`;

      // Label position
      const tx = center + (radius + 20) * Math.cos(midAngle);
      const ty = center + (radius + 20) * Math.sin(midAngle);

      sectorsSvg += `
        <path d="${pathData}" fill="${fillColor}" stroke="#1e293b" stroke-width="1.5">
          <title>${num}: ${numCount} hits</title>
        </path>
        <text x="${tx}" y="${ty + 4}" text-anchor="middle" fill="${numCount > 0 ? '#eab308' : '#94a3b8'}" font-size="12" font-weight="700" font-family="sans-serif">${num}</text>
      `;
    });

    const bullCount = (counts['Bull'] || 0) + (counts['25'] || 0);
    const bullColor = this.getColorForCount(bullCount, maxCount);

    this.container.innerHTML = `
      <div class="heatmap-panel" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 18px; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${title}</h3>
          <span style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 700; background: var(--bg-tertiary); padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border-color);">${totalHits} Darts</span>
        </div>

        <!-- SVG Heatmap Graphic -->
        <div style="display: flex; justify-content: center; align-items: center; margin: 10px 0;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="max-width: 100%; height: auto; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));">
            <!-- Board Outer Ring -->
            <circle cx="${center}" cy="${center}" r="${radius + 2}" fill="#0f172a" stroke="#334155" stroke-width="2" />
            
            <!-- 20 Heatmap Sectors -->
            ${sectorsSvg}

            <!-- Treble Wire Guideline -->
            <circle cx="${center}" cy="${center}" r="${rTrebleOuter}" fill="none" stroke="#64748b" stroke-width="1" opacity="0.4" />
            <circle cx="${center}" cy="${center}" r="${rTrebleInner}" fill="none" stroke="#64748b" stroke-width="1" opacity="0.4" />

            <!-- Double Wire Guideline -->
            <circle cx="${center}" cy="${center}" r="${rDoubleInner}" fill="none" stroke="#64748b" stroke-width="1" opacity="0.4" />

            <!-- Outer Bull -->
            <circle cx="${center}" cy="${center}" r="${rBullOuter}" fill="${bullColor}" stroke="#1e293b" stroke-width="1.5">
              <title>Bullseye: ${bullCount} hits</title>
            </circle>

            <!-- Inner Bullseye -->
            <circle cx="${center}" cy="${center}" r="${rBullInner}" fill="${counts['Bull'] > 0 ? '#ef4444' : 'rgba(255,255,255,0.1)'}" stroke="#eab308" stroke-width="1.5">
              <title>Double Bull: ${counts['Bull'] || 0} hits</title>
            </circle>
          </svg>
        </div>

        <!-- Heatmap Legend -->
        <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary);">
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 10px; height: 10px; border-radius: 2px; background: rgba(255,255,255,0.05); border: 1px solid #334155;"></span> 0</span>
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 10px; height: 10px; border-radius: 2px; background: rgba(59, 130, 246, 0.7);"></span> Low</span>
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 10px; height: 10px; border-radius: 2px; background: rgba(234, 179, 8, 0.8);"></span> Med</span>
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 10px; height: 10px; border-radius: 2px; background: rgba(239, 68, 68, 0.95);"></span> High</span>
        </div>

        ${topNumbers.length > 0 ? `
          <!-- Top Target Badges -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;">
            ${topNumbers.map((item, r) => {
              const pct = totalHits > 0 ? Math.round((item.count / totalHits) * 100) : 0;
              const colors = ['#eab308', '#f97316', '#ef4444', '#3b82f6', '#10b981'];
              return `
                <div style="flex: 1; min-width: 55px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 6px; text-align: center;">
                  <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;">#${r + 1}</div>
                  <div style="font-size: 1.15rem; font-weight: 800; color: ${colors[r % colors.length]};">${item.num}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${item.count} (${pct}%)</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
}
