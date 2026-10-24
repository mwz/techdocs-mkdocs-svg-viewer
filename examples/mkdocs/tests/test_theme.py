import re
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from mkdocs.commands.build import build
from mkdocs.config import load_config


class MaterialThemeTest(unittest.TestCase):
    def test_generated_pages_keep_the_configured_palette(self):
        config_file = Path(__file__).resolve().parents[1] / "mkdocs.yml"
        for scheme in ("default", "slate"):
            with self.subTest(scheme=scheme), TemporaryDirectory() as output:
                config = load_config(config_file=str(config_file), site_dir=output)
                config["theme"]["palette"] = {"scheme": scheme}
                build(config)
                for page in ("index.html", "order-service/index.html"):
                    html = (Path(output) / page).read_text(encoding="utf-8")
                    body = re.search(r"<body\b[^>]*>", html).group()
                    self.assertIn(f'data-md-color-scheme="{scheme}"', body)


if __name__ == "__main__":
    unittest.main()
