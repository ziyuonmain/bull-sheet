import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

describe('Static Assets & Service Worker Cache Integrity', () => {
  test('all assets listed in sw.js ASSETS_TO_CACHE exist on disk', () => {
    const swPath = path.join(ROOT_DIR, 'sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');

    // Extract all strings in ASSETS_TO_CACHE array
    const match = swContent.match(/const\s+ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match, 'ASSETS_TO_CACHE array should exist in sw.js');

    const assetEntries = match[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(s => s.length > 0 && s !== './');

    for (const relPath of assetEntries) {
      const cleanPath = relPath.replace(/^\.\//, '');
      const fullPath = path.join(ROOT_DIR, cleanPath);
      assert.ok(
        fs.existsSync(fullPath),
        `Asset referenced in sw.js not found on disk: ${cleanPath}`
      );
    }
  });

  test('all icons listed in manifest.json exist on disk', () => {
    const manifestPath = path.join(ROOT_DIR, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.ok(Array.isArray(manifest.icons), 'manifest.json must declare an icons array');
    for (const icon of manifest.icons) {
      const iconPath = path.join(ROOT_DIR, icon.src);
      assert.ok(
        fs.existsSync(iconPath),
        `Icon referenced in manifest.json not found on disk: ${icon.src}`
      );
    }
  });
});
