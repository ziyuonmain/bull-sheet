import unittest
import os
import re

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class VerificationTests(unittest.TestCase):

    def test_no_tv_mode_references(self):
        """Ensure TV mode is completely removed from all source files"""
        tv_matches = []
        for root, dirs, files in os.walk(BASE_DIR):
            if '.git' in root or 'tests' in root:
                continue
            for f in files:
                if f.endswith(('.html', '.js', '.css', '.json')):
                    path = os.path.join(root, f)
                    with open(path, 'r', encoding='utf-8') as fp:
                        content = fp.read()
                        if 'tv-mode' in content or 'view-tv' in content or 'renderTVMode' in content or 'btn-tv-mode' in content:
                            tv_matches.append(f"{f}: found TV mode reference")
        self.assertEqual(len(tv_matches), 0, f"Found lingering TV mode references: {tv_matches}")

    def test_no_total_keypad_references(self):
        """Ensure old Total Keypad is removed from markup and scripts"""
        keypad_matches = []
        for root, dirs, files in os.walk(BASE_DIR):
            if '.git' in root or 'tests' in root:
                continue
            for f in files:
                if f.endswith(('.html', '.js', '.json')):
                    path = os.path.join(root, f)
                    with open(path, 'r', encoding='utf-8') as fp:
                        content = fp.read()
                        if re.search(r"['\"](?:\./)?(?:js/)?components/keypad\.js['\"]", content) or 'id="keypad-container"' in content:
                            keypad_matches.append(f"{f}")
        self.assertEqual(len(keypad_matches), 0, f"Found lingering keypad references: {keypad_matches}")

    def test_sw_cached_assets_exist(self):
        """Ensure all assets listed in Service Worker cache array exist on disk"""
        sw_path = os.path.join(BASE_DIR, 'sw.js')
        with open(sw_path, 'r', encoding='utf-8') as f:
            sw_content = f.read()

        match = re.search(r'const ASSETS_TO_CACHE = \[(.*?)\];', sw_content, re.DOTALL)
        self.assertIsNotNone(match, "Could not find ASSETS_TO_CACHE in sw.js")

        assets = [a.strip().strip("'").strip('"') for a in match.group(1).split(',') if a.strip()]
        for asset in assets:
            clean = asset.lstrip('./').lstrip('/')
            if not clean:
                target = os.path.join(BASE_DIR, 'index.html')
            else:
                target = os.path.join(BASE_DIR, clean)
            self.assertTrue(os.path.exists(target), f"Cached asset does not exist on disk: {clean}")

    def test_all_game_engines_have_undo(self):
        """Ensure all 10 game engine modules implement recordDart and undo"""
        engines_dir = os.path.join(BASE_DIR, 'js', 'games')
        engines = [f for f in os.listdir(engines_dir) if f.endswith('.js')]
        self.assertEqual(len(engines), 10, "Expected exactly 10 game engine files")
        for eng in engines:
            with open(os.path.join(engines_dir, eng), 'r', encoding='utf-8') as f:
                code = f.read()
                self.assertIn("recordDart(", code, f"{eng} is missing recordDart()")
                self.assertIn("undo()", code, f"{eng} is missing undo()")

    def test_brand_tagline(self):
        """Ensure brand tagline in index.html is correct"""
        index_path = os.path.join(BASE_DIR, 'index.html')
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn('Because pub math is total bull-sheet.', content)

    def test_caller_and_sound_interfaces(self):
        """Ensure caller.js and sound_effects.js expose all methods invoked by app.js"""
        with open(os.path.join(BASE_DIR, 'js', 'audio', 'caller.js'), 'r', encoding='utf-8') as f:
            caller_code = f.read()
        for method in ['toggle(', 'toggleSarcasm(', 'speak(', 'callSingleDart(', 'callScore(', 'callBust(', 'callGameShot(', 'callTurn(', 'setStyle(']:
            self.assertIn(method, caller_code, f"caller.js is missing {method}")

        with open(os.path.join(BASE_DIR, 'js', 'audio', 'sound_effects.js'), 'r', encoding='utf-8') as f:
            sound_code = f.read()
        for method in ['toggle(', 'setVolume(', 'playClick(', 'playDartHit(', 'playTrebleHit(', 'playBullseye(', 'playWin(', 'playBust(']:
            self.assertIn(method, sound_code, f"sound_effects.js is missing {method}")

if __name__ == '__main__':
    unittest.main()
