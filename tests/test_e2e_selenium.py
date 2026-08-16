import unittest
import time
import os

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.firefox.options import Options as FirefoxOptions
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False

@unittest.skipUnless(SELENIUM_AVAILABLE, "Selenium not installed (run: pip install selenium)")
class BullSheetE2ETests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        options = FirefoxOptions()
        options.add_argument("--headless")
        try:
            cls.driver = webdriver.Firefox(options=options)
        except Exception:
            chrome_options = ChromeOptions()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            cls.driver = webdriver.Chrome(options=chrome_options)
        
        cls.driver.implicitly_wait(4)
        cls.base_url = "http://localhost:8080/"

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'driver') and cls.driver:
            cls.driver.quit()

    def test_01_homepage_loads_and_has_brand(self):
        self.driver.get(self.base_url)
        title = self.driver.find_element(By.CLASS_NAME, "brand-title").text
        self.assertIn("BullSheet", title)
        tagline = self.driver.find_element(By.CLASS_NAME, "brand-tagline").text
        self.assertIn("Because pub math is total bull-sheet.", tagline)

    def test_02_start_match_and_verify_right_panel_actions(self):
        self.driver.get(self.base_url)
        # Click Start Match
        start_btn = self.driver.find_element(By.ID, "btn-start-match")
        start_btn.click()
        time.sleep(0.5)

        # Verify Game View is active
        game_view = self.driver.find_element(By.ID, "view-game")
        self.assertIn("active-view", game_view.get_attribute("class"))

        # Verify Right-Panel Actions (Undo & Miss) are present
        undo_btn = self.driver.find_element(By.ID, "btn-keypad-undo")
        self.assertTrue(undo_btn.is_displayed())
        miss_btn = self.driver.find_element(By.CLASS_NAME, "btn-action-miss")
        self.assertTrue(miss_btn.is_displayed())

    def test_03_throw_3_darts_and_verify_slot_retention_and_next_player(self):
        self.driver.get(self.base_url)
        self.driver.find_element(By.ID, "btn-start-match").click()
        time.sleep(0.5)

        # Throw Dart 1: T20
        t20_btn = self.driver.find_element(By.CLASS_NAME, "btn-quick-t20")
        t20_btn.click()
        time.sleep(0.2)

        # Throw Dart 2: T20
        t20_btn.click()
        time.sleep(0.2)

        # Throw Dart 3: T20
        t20_btn.click()
        time.sleep(0.3)

        # Verify slots retain T20 on all 3 darts
        slots = self.driver.find_elements(By.CLASS_NAME, "dart-slot")
        self.assertEqual(len(slots), 3)
        for slot in slots:
            self.assertIn("filled", slot.get_attribute("class"))

        # Verify Next Player button appears and is visible
        next_btn = self.driver.find_element(By.ID, "btn-keypad-next")
        self.assertTrue(next_btn.is_displayed())
        self.assertIn("active-pulse", next_btn.get_attribute("class"))

        # Click Next Player to advance turn
        next_btn.click()
        time.sleep(0.3)

        # Verify slots are reset for Player 2
        fresh_slots = self.driver.find_elements(By.CLASS_NAME, "dart-slot")
        for slot in fresh_slots:
            self.assertNotIn("filled", slot.get_attribute("class"))

if __name__ == '__main__':
    unittest.main()
