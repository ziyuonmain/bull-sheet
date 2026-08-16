import unittest
import os

class SandwichMenuTests(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def test_burger_markup_in_html(self):
        with open(os.path.join(self.base_dir, 'index.html'), 'r', encoding='utf-8') as f:
            html = f.read()

        self.assertIn('id="btn-burger-menu"', html, "Hamburger button #btn-burger-menu must exist in index.html")
        self.assertIn('id="drawer-burger-menu"', html, "Drawer container #drawer-burger-menu must exist in index.html")
        self.assertIn('id="drawer-burger-backdrop"', html, "Backdrop #drawer-burger-backdrop must exist in index.html")
        self.assertIn('id="btn-close-burger"', html, "Close button #btn-close-burger must exist in index.html")
        self.assertIn('data-target="view-setup"', html)
        self.assertIn('data-target="view-stats"', html)
        self.assertIn('data-target="view-settings"', html)

    def test_burger_styles_in_css(self):
        with open(os.path.join(self.base_dir, 'css', 'main.css'), 'r', encoding='utf-8') as f:
            css = f.read()

        self.assertIn('.btn-burger-trigger', css, ".btn-burger-trigger style must exist")
        self.assertIn('.drawer-sidebar', css, ".drawer-sidebar style must exist")
        self.assertIn('.drawer-backdrop', css, ".drawer-backdrop style must exist")
        self.assertIn('.drawer-sidebar.open', css, ".drawer-sidebar.open style must exist")

    def test_burger_handlers_in_app_js(self):
        with open(os.path.join(self.base_dir, 'js', 'app.js'), 'r', encoding='utf-8') as f:
            js = f.read()

        self.assertIn('openBurgerDrawer', js, "openBurgerDrawer method must exist in app.js")
        self.assertIn('closeBurgerDrawer', js, "closeBurgerDrawer method must exist in app.js")
        self.assertIn('btn-burger-menu', js, "btn-burger-menu click listener must exist in app.js")
        self.assertIn('btn-close-burger', js, "btn-close-burger click listener must exist in app.js")
        self.assertIn('drawer-burger-backdrop', js, "drawer-burger-backdrop click listener must exist in app.js")

if __name__ == '__main__':
    unittest.main()
