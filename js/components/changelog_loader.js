// Dynamic In-App Changelog Loader for BullSheet
// Parses CHANGELOG.md as the single source of truth and renders styled release cards

let cachedHtml = null;

export async function loadAndRenderChangelog(containerEl) {
  if (!containerEl) return;
  if (cachedHtml) {
    containerEl.innerHTML = cachedHtml;
    return;
  }

  try {
    const response = await fetch('./CHANGELOG.md?v=' + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    const html = parseChangelogMarkdown(markdown);
    cachedHtml = html;
    containerEl.innerHTML = html;
  } catch (err) {
    console.warn('Failed to load CHANGELOG.md directly, using fallback:', err);
    containerEl.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-secondary);">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">📜 Release Notes</p>
        <p style="font-size: 0.9rem;">View complete release notes online at <a href="https://github.com/zyu-wok/bull-sheet/blob/main/CHANGELOG.md" target="_blank" style="color: var(--accent-gold); text-decoration: underline;">CHANGELOG.md on GitHub</a>.</p>
      </div>
    `;
  }
}

export function parseChangelogMarkdown(markdown) {
  if (!markdown) return '';
  const versionBlocks = markdown.split(/^##\s+\[/m).slice(1);
  if (versionBlocks.length === 0) return '<p>No releases found.</p>';

  const cardsHtml = versionBlocks.map((block, index) => {
    const headerEnd = block.indexOf('\n');
    const headerLine = (headerEnd !== -1 ? block.slice(0, headerEnd) : block).trim();
    const content = (headerEnd !== -1 ? block.slice(headerEnd) : '').trim();

    // Match e.g. "1.4.1] - 2026-08-16"
    const match = headerLine.match(/^([^\]]+)\]\s*-\s*([0-9-]+)/);
    if (!match) return '';

    const rawVer = match[1].trim();
    const ver = 'v' + rawVer.replace(/^v/, '');
    const date = match[2].trim();
    const isLatest = index === 0;

    // Extract title from first "### " line
    const titleMatch = content.match(/^###\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : `Release ${ver}`;

    // Extract list items
    const lines = content.split('\n');
    const items = [];
    let currentItem = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('- **') || line.startsWith('- ')) {
        if (currentItem) items.push(currentItem);
        currentItem = line.replace(/^-\s*/, '');
      } else if (line.startsWith('  - ')) {
        currentItem += '<br>' + line.replace(/^-\s*/, '');
      } else if (currentItem && line && !line.startsWith('#') && !line.startsWith('---')) {
        currentItem += ' ' + line;
      }
    }
    if (currentItem) items.push(currentItem);

    const listHtml = items.map(item => {
      let formatted = item
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      return `<li>${formatted}</li>`;
    }).join('\n              ');

    return `
          <!-- ${ver} -->
          <article class="changelog-card-page">
            <div class="cl-page-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="cl-ver-page">${ver}</span>
                ${isLatest ? '<span class="cl-tag tag-latest">LATEST</span>' : ''}
              </div>
              <span class="cl-date-page">${date}</span>
            </div>
            <h3 class="cl-title-page">${title}</h3>
            <ul class="cl-list-page">
              ${listHtml}
            </ul>
          </article>`;
  }).filter(Boolean);

  return cardsHtml.join('\n');
}
