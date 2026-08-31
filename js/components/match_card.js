// Shareable Match Card Generator (Text Copy & Canvas Image Export) for BullSheet

export class MatchCardGenerator {
  static extractPlayerStats(p, gameType = 'x01') {
    const score = p.score !== undefined ? p.score : (p.stats?.totalScore || 0);
    
    if (gameType === 'cricket') {
      const mpr = p.mpr || (p.stats?.mpr) || (p.stats?.totalDarts > 0 ? ((p.stats.totalMarks / p.stats.totalDarts) * 3).toFixed(2) : '—');
      const marks = p.totalMarks || p.stats?.totalMarks || 0;
      return {
        name: p.name || 'Player',
        col1Label: 'Score',
        col1Val: `${score} pts`,
        col2Label: 'MPR',
        col2Val: `${mpr}`,
        col3Label: 'Marks',
        col3Val: `${marks}`
      };
    }

    if (gameType === 'bobs27') {
      const doubles = p.totalDoublesHit || p.stats?.totalDoublesHit || 0;
      const status = p.isEliminated ? 'Knockout' : 'Survived';
      return {
        name: p.name || 'Player',
        col1Label: 'Score',
        col1Val: `${score}`,
        col2Label: 'Status',
        col2Val: status,
        col3Label: 'Doubles',
        col3Val: `${doubles}`
      };
    }

    if (gameType === 'killer') {
      const kills = p.kills || p.stats?.kills || 0;
      const lives = p.lives !== undefined ? p.lives : (p.stats?.lives || 0);
      return {
        name: p.name || 'Player',
        col1Label: 'Status',
        col1Val: p.won ? '👑 Winner' : (p.isEliminated ? '☠️ Out' : 'Alive'),
        col2Label: 'Kills',
        col2Val: `${kills}`,
        col3Label: 'Lives',
        col3Val: `${lives}`
      };
    }

    if (gameType === 'elimination') {
      const survived = p.roundsSurvived || p.stats?.roundsSurvived || 0;
      return {
        name: p.name || 'Player',
        col1Label: 'Status',
        col1Val: p.won ? '👑 Survivor' : '☠️ Out',
        col2Label: 'Rounds',
        col2Val: `${survived}`,
        col3Label: 'Lives',
        col3Val: `${p.lives !== undefined ? p.lives : 0}`
      };
    }

    // Default / X01
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
      col1Label: 'Score',
      col1Val: `${score}`,
      col2Label: '3-Dart Avg',
      col2Val: `${avg}`,
      col3Label: 'High / 180s',
      col3Val: `${high}${maxes > 0 ? ` (${maxes}x 180)` : ''}`,
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
      `BullSheet Match Summary • ${dateStr}`,
      `🏆 Winner: ${winnerName}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🎮 Mode: ${modeName}`,
      `👥 Results:`
    ];

    if (match.players && Array.isArray(match.players)) {
      match.players.forEach(rawP => {
        const p = this.extractPlayerStats(rawP, match.gameType);
        lines.push(`• ${p.name}: ${p.col1Label}: ${p.col1Val} | ${p.col2Label}: ${p.col2Val} | ${p.col3Label}: ${p.col3Val}`);
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
    ctx.fillText('BULLSHEET MATCH SUMMARY', 40, 60);

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
    const sample = match.players && match.players[0] ? this.extractPlayerStats(match.players[0], match.gameType) : null;
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('PLAYER', 60, y);
    ctx.fillText((sample?.col1Label || 'SCORE').toUpperCase(), 260, y);
    ctx.fillText((sample?.col2Label || 'AVG / RESULT').toUpperCase(), 430, y);
    ctx.fillText((sample?.col3Label || 'STATS').toUpperCase(), 600, y);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(40, y + 10);
    ctx.lineTo(760, y + 10);
    ctx.stroke();

    y += 40;
    if (match.players && Array.isArray(match.players)) {
      match.players.slice(0, 4).forEach(rawP => {
        const p = this.extractPlayerStats(rawP, match.gameType);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(p.name, 60, y);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${p.col1Val}`, 260, y);
        ctx.fillText(`${p.col2Val}`, 430, y);
        ctx.fillText(`${p.col3Val}`, 600, y);
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
