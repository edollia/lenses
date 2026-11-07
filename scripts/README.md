Run `python3 scripts/check_site_links.py` before publishing to check local page links, static fragments, and image references in the site's HTML, JavaScript, and CSS. It checks filenames with the same case sensitivity used by production hosting. External links and dynamically generated URLs are outside its scope.

Run `node --test tests/pricing.test.cjs` to check pricing, quantities, prescription surcharges, and cart-to-order totals. Both checks also run in GitHub Actions on pushes and pull requests.
