#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseSemVer(v) {
  const parts = v.trim().replace(/^v/, '').split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid SemVer string: "${v}"`);
  }
  return { major: parts[0], minor: parts[1], patch: parts[2] };
}

function bumpVersion(current, type) {
  const parsed = parseSemVer(current);
  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
    default:
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

function run() {
  const arg = (process.argv[2] || 'patch').toLowerCase().trim();
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentVersion = pkg.version;

  let nextVersion = '';
  if (['patch', 'minor', 'major'].includes(arg)) {
    nextVersion = bumpVersion(currentVersion, arg);
  } else if (/^\d+\.\d+\.\d+$/.test(arg.replace(/^v/, ''))) {
    nextVersion = arg.replace(/^v/, '');
  } else {
    console.error(`❌ Unknown version bump type: "${arg}". Use "patch", "minor", "major", or a valid semver like "1.5.0".`);
    process.exit(1);
  }

  console.log(`\n🚀 Bumping BullSheet version: v${currentVersion} ➔ v${nextVersion}\n`);

  // 1. Update package.json
  pkg.version = nextVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated package.json (${nextVersion})`);

  // 2. Update package-lock.json if present
  const lockPath = path.join(ROOT_DIR, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    lock.version = nextVersion;
    if (lock.packages && lock.packages['']) {
      lock.packages[''].version = nextVersion;
    }
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
    console.log(`✅ Updated package-lock.json (${nextVersion})`);
  }

  // 3. Update index.html header badge
  const indexPath = path.join(ROOT_DIR, 'index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf8');
  indexHtml = indexHtml.replace(
    /id="btn-header-version"\s+title="Version [^"•]+•\s+Click to view Changelog">v[^<]+<\/span>/,
    `id="btn-header-version" title="Version ${nextVersion} • Click to view Changelog">v${nextVersion}</span>`
  );
  fs.writeFileSync(indexPath, indexHtml);
  console.log(`✅ Updated index.html header badge (v${nextVersion})`);

  // 4. Update tests/unit/changelog.test.js
  const testPath = path.join(ROOT_DIR, 'tests/unit/changelog.test.js');
  if (fs.existsSync(testPath)) {
    let testContent = fs.readFileSync(testPath, 'utf8');
    testContent = testContent.replace(
      /assert\.ok\(html\.includes\('v[^']+'\),\s*'CHANGELOG\.md should contain current v[^']+'\);/,
      `assert.ok(html.includes('v${nextVersion}'), 'CHANGELOG.md should contain current v${nextVersion}');`
    );
    fs.writeFileSync(testPath, testContent);
    console.log(`✅ Updated tests/unit/changelog.test.js (v${nextVersion})`);
  }

  // 5. Check or template CHANGELOG.md
  const changelogPath = path.join(ROOT_DIR, 'CHANGELOG.md');
  let changelogContent = fs.readFileSync(changelogPath, 'utf8');
  const hasVersionSection = changelogContent.includes(`## [${nextVersion}]`);

  if (!hasVersionSection) {
    const today = getTodayISO();
    const template = `## [${nextVersion}] - ${today}\n### 🎯 Release Highlights\n#### Added\n- Describe new features here\n\n#### Changed\n- Describe changed functionality here\n\n#### Fixed\n- Describe bug fixes here\n\n---\n\n`;
    
    // Insert right after the header line (after first "---")
    const parts = changelogContent.split('---\n\n');
    if (parts.length >= 2) {
      changelogContent = parts[0] + '---\n\n' + template + parts.slice(1).join('---\n\n');
    } else {
      changelogContent = changelogContent.replace('# Changelog\n\n', `# Changelog\n\n---\n\n${template}`);
    }
    fs.writeFileSync(changelogPath, changelogContent);
    console.log(`📝 Added skeleton release notes in CHANGELOG.md for v${nextVersion}`);
  } else {
    console.log(`✅ CHANGELOG.md already has section for [${nextVersion}]`);
  }

  // 6. Run verification tests
  console.log('\n🧪 Running test suite verification...');
  try {
    execSync('npm run lint && npm run test:unit', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✅ All linting and unit tests passed!');
  } catch {
    console.error('❌ Verification failed. Please check errors above.');
    process.exit(1);
  }

  console.log(`\n🎉 Successfully bumped BullSheet to v${nextVersion}!`);
  console.log(`\nNext steps:`);
  console.log(`  1. Fill in release notes in CHANGELOG.md (if not already done)`);
  console.log(`  2. Commit: git commit -am "chore(release): bump version to ${nextVersion} and update changelog"`);
  console.log(`  3. Tag: git tag -a v${nextVersion} -m "Release v${nextVersion}"`);
  console.log(`  4. Push: git push origin main --tags\n`);
}

run();
