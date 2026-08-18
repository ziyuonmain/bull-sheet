// Shareable Match Card Generator (Text Copy & Canvas Image Export) for BullSheet

export class MatchCardGenerator {
  static extractPlayerStats(p) {
    const score = p.score !== undefined ? p.score : (p.stats?.totalScore || 0);
    let avg = '—';
    if (p.threeDartAvg !== undefined) {
      avg = p.threeDartAvg;
    } else if (p.stats?.totalDarts > 0) {
      avg = ((p.stats.totalScore / p.stats.totalDarts) * 3).toFixed(1);
    } else if (p.totalDartsThrown > 0 && p.totalScoreScored !== undefined) {
      avg = ((p.totalScoreScored / p.totalDartsThrown) * 3).toFixed(1);
    }

    const high = p.stats?.highTurn || p.highestTurn || p.highTurn || (p.turns && p.turns.length ? Math.max(0, ...p.turns) : '—');
    const maxes = p.stats?.count180 || p.count180 || p.oneEightiesCount || 0;

    return {
      name: p.name || 'Player',
      score,
      avg,
      high,
      maxes
    };
  }

  static formatTextSummary(match) {
    if (!match) return '';

    const winnerName = match.winner?.name || (match.players?.find(p => p.won)?.name) || match.players?.[0]?.name || 'Winner';
    const modeName = match.gameType ? match.gameType.toUpperCase() : 'DARTS';
    const dateStr = new Date(match.date || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    let lines = [
      `🎯 BullSheet Match Summary • ${dateStr}`,
      `🏆 Winner: ${winnerName}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🎮 Mode: ${modeName}`,
      `👥 Results & Statistics:`
    ];

    if (match.players && Array.isArray(match.players)) {
      match.players.forEach(rawP => {
        const p = this.extractPlayerStats(rawP);
        lines.push(`• ${p.name}: ${p.score} pts | Avg: ${p.avg} | High: ${p.high}${p.maxes > 0 ? ` | 180s: ${p.maxes}` : ''}`);
      });
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🎯 Scored on BullSheet • https://ziyuonmain.github.io/bull-sheet/`);

    return lines.join('\n');
  }

  static generateCanvasImage(match) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
    bgGrad.addColorStop(0, '#12151b');
    bgGrad.addColorStop(1, '#1b202c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 500);

    // Outer Border
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 776, 476);

    // Header Title
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('🎯 BULLSHEET MATCH SUMMARY', 40, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const dateStr = new Date(match.date || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillText(`Mode: ${(match.gameType || 'Darts').toUpperCase()} • ${dateStr}`, 40, 90);

    // Winner Banner
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 115, 720, 60);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 115, 720, 60);

    const winnerName = match.winner?.name || (match.players?.find(p => p.won)?.name) || match.players?.[0]?.name || 'Player';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`🏆 Winner: ${winnerName}`, 60, 153);

    // Table Headers
    let y = 220;
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PLAYER', 60, y);
    ctx.fillText('FINAL SCORE', 260, y);
    ctx.fillText('3-DART AVG', 430, y);
    ctx.fillText('HIGH TURN', 580, y);
    ctx.fillText('180s', 700, y);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(40, y + 10);
    ctx.lineTo(760, y + 10);
    ctx.stroke();

    y += 40;
    if (match.players && Array.isArray(match.players)) {
      match.players.slice(0, 4).forEach(rawP => {
        const p = this.extractPlayerStats(rawP);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(p.name, 60, y);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${p.score}`, 260, y);
        ctx.fillText(`${p.avg}`, 430, y);
        ctx.fillText(`${p.high}`, 580, y);
        ctx.fillText(`${p.maxes}`, 700, y);
        y += 35;
      });
    }

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('No Ads • 100% Free • https://ziyuonmain.github.io/bull-sheet/', 40, 460);

    return canvas.toDataURL('image/png');
  }
}
