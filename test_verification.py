import os
import re

print("=" * 60)
print("🧪 BULLSHEET COMPREHENSIVE AUTOMATED VERIFICATION SUITE")
print("=" * 60)

BASE_DIR = "/home/ziyu/Code/git-codespace/bull-sheet"

# 1. Check TV Mode is completely absent from all source files
print("\n[Test 1] Verifying Complete Removal of TV Mode...")
tv_matches = []
for root, dirs, files in os.walk(BASE_DIR):
    if '.git' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.css', '.json')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fp:
                content = fp.read()
                if re.search(r'btn-toggle-tv-mode|oche-tv-mode|tv\s*mode', content, re.IGNORECASE):
                    tv_matches.append(f"{f}: found TV mode reference")

assert len(tv_matches) == 0, f"Found lingering TV mode references: {tv_matches}"
print("✅ Verified: 0 TV mode references found in any source file!")

# 2. Check Total Keypad is completely removed
print("\n[Test 2] Verifying Removal of Total Keypad...")
keypad_matches = []
for root, dirs, files in os.walk(BASE_DIR):
    if '.git' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.json')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fp:
                content = fp.read()
                if re.search(r"['\"](?:\./)?(?:js/)?components/keypad\.js['\"]", content) or 'id="keypad-container"' in content:
                    keypad_matches.append(f"{f}")

assert len(keypad_matches) == 0, f"Found lingering keypad references: {keypad_matches}"
print("✅ Verified: 0 Total Keypad references found!")

# 3. Check All SW Assets Exist On Disk
print("\n[Test 3] Verifying All Service Worker Cached Assets Exist On Disk...")
sw_path = os.path.join(BASE_DIR, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as fp:
    sw_content = fp.read()

matches = re.findall(r"'(\./[^']+)'", sw_content)
for asset in matches:
    clean_path = asset.replace('./', '')
    if clean_path:
        full_path = os.path.join(BASE_DIR, clean_path)
        assert os.path.exists(full_path), f"Asset in sw.js does NOT exist: {full_path}"

print(f"✅ Verified: All {len(matches)} service worker cache assets exist on disk!")

# 4. Check All 9 Game Engines Exist and Have Necessary Methods
print("\n[Test 4] Verifying All 9 Game Engines Structure & Undo...")
engines = [
    "x01.js", "cricket.js", "highscore.js", "shooter.js",
    "split_score.js", "shanghai.js", "killer.js", "elimination.js", "around_clock.js"
]

for eng in engines:
    eng_path = os.path.join(BASE_DIR, "js", "games", eng)
    assert os.path.exists(eng_path), f"Engine file missing: {eng_path}"
    with open(eng_path, 'r', encoding='utf-8') as fp:
        code = fp.read()
        assert "recordDart" in code, f"{eng} missing recordDart method"
        assert "undo" in code, f"{eng} missing undo method"

print(f"✅ Verified: All {len(engines)} game engines contain recordDart() and undo() implementations!")

# 5. Check Tagline in index.html
print("\n[Test 5] Verifying Brand Tagline in index.html...")
with open(os.path.join(BASE_DIR, "index.html"), 'r', encoding='utf-8') as fp:
    html = fp.read()
    assert "Because pub math is total bull-sheet." in html, "Tagline not updated in index.html"

print("✅ Verified: Brand tagline matches 'Because pub math is total bull-sheet.'!")

print("\n" + "=" * 60)
print("🎉 ALL 5 VERIFICATION SUITES PASSED 100%!")
print("=" * 60)
