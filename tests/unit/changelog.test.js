import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelogMarkdown } from '../../js/components/changelog_loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Changelog Parser & Integrity', () => {
  test('parses markdown changelog entries correctly into HTML cards', () => {
    const sample = `
# Changelog
## [1.4.1] - 2026-08-16
### Bob's 27 & Training Overhaul
- Added Bob's 27 training drill.
- Fixed bot aim simulation.

## [1.4.0] - 2026-08-15
### Initial Release
- Launched BullSheet darts scorer.
`;

    const html = parseChangelogMarkdown(sample);
    assert.ok(html.includes('v1.4.1'));
    assert.ok(html.includes('2026-08-16'));
    assert.ok(html.includes("Bob's 27"));
    assert.ok(html.includes('v1.4.0'));
  });

  test('validates actual project CHANGELOG.md file format and latest version', () => {
    const changelogPath = path.resolve(__dirname, '../../CHANGELOG.md');
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');

    const html = parseChangelogMarkdown(changelogContent);
    assert.ok(html.includes('v1.5.0'), 'CHANGELOG.md should contain current v1.5.0');
    assert.ok(!html.includes('No releases found'), 'Changelog parser should succeed on actual file');
  });
});
