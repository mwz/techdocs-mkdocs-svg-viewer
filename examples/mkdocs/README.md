# Build the MkDocs fixture

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
mkdocs build
```

Inspect `site/index.html`: it should contain an inline `<svg>`, rather than an
`<img>` for this diagram. Publish it through your normal TechDocs pipeline to
smoke-test the Backstage integration. `/guide/` is an illustrative link; replace
it with a route that exists in your own docs.
