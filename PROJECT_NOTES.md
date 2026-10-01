# 157 Cardinal Ln Dashboard, Project Notes

Read this first in any new session. It holds the context, conventions, and open items.

## Repo and deploy

* GitHub: `AltecBX/Pocono-Home`
* Live: https://altecbx.github.io/Pocono-Home/
* `index.html` is the dashboard. `cardinal_ln_dashboard.html` is the working copy and must stay byte for byte identical. After every edit run `cp index.html cardinal_ln_dashboard.html`.
* `parcel-record.html` is a static snapshot of the Monroe County parcel record, linked from Property Profile.
* Any push to `main` deploys through GitHub Pages. Push every dashboard edit to `main`, no need to ask.
* Before every push run `node scripts/validate.mjs`. CI runs the same check on every push and PR (`.github/workflows/validate.yml`).

## Subject property

* 157 Cardinal Ln, Pocono Lake PA 18347. Locust Lake Village, Coolbaugh Township, Monroe County.
* Asking $329,999. 3 BR / 3 BA, 1,432 SF above grade plus 657 SF finished basement, built 1995, 0.53 acres, 520 SF detached garage.
* MLS PM-141523. Parcel 03.20C.1.14. Coordinates 41.157324, -75.551245.
* HOA $1,800/yr, taxes $4,554/yr, insurance budget $1,300/yr.
* New roof Apr 2026, septic pumped every 3 yrs ($325), private well, electric baseboard plus heat pump, 1 fireplace, not in flood zone.
* Buyers: Jerry Pena and Theresa Gaglia. 25% down, 7.0% target rate, 30 yr. Settlement July 6, 2026.

## Architecture

Single static file, no build step, no dependencies.

* CSS at the top. Design tokens on `:root` (black background, gold accents `--gold-1`, `--gold-2`, Apple system accent colors).
* HTML body, sections in page order. Collapsible sections use `.section.collapsible` with an `id`, state saved in localStorage.
* One inline `<script>` at the bottom.
  * `DEFAULTS` and `ids` drive Adjustable Assumptions. `recalc()` reads inputs and refreshes every live number on the page.
  * `COMP_DATA = { active: [...], sold: [...] }` is the comp set. Subject row first in each array with `isSubject: true`.
  * Max Offer Calculator: `MO_RESERVES`, `MO_ISSUES`, `moState`, `renderMO()`, `renderMOOverAsk()`.
  * Map: Google Maps JS API with `PricePillOverlay` price pills. Key is restricted by HTTP referrer to altecbx.github.io and localhost, so the map does not load from `file://`.

### localStorage keys

* `cardinal-ln-assumptions-v1` Adjustable Assumptions
* `cardinal-ln-max-offer-v1` Max Offer reserves, comp value, checked issues
* `cardinal-ln-collapse-states-v1` collapsed sections
* `cardinal-ln-heatmap-blocks-v1`, `cardinal-ln-heatmap-scenario-v1` STR heatmap

## Comp data rules

Recent Comps is the most important section.

* Locust Lake Village and Arrowhead Lakes only. At least 20 sold comps.
* Every sold row needs: address, lat, lng, community, year, bedbath (`"3 / 2"`), sqft, psf, price (sold), listPrice, delta, dom, listedDate, soldDate (`M/D/YY`), zurl (Zillow URL with zpid).
* `delta` is (sold minus list) divided by list, in percent, two decimals. `psf` is sold price divided by sqft, rounded. `dom` is days from listedDate to soldDate. The validator enforces all three.
* Source of truth for sold comps is Jerry's manually verified spreadsheet. Do not override a value from it.
* Geocode new addresses with the Google Geocoding API and the same key. Only accept `ROOFTOP` precision.

## Voice and formatting

* No hyphens or em dashes in copy. Periods and commas only.
* Numerals for times (4:30pm). Double quote for measurements (30").
* Compact. Direct NYC contractor voice. No sales speak (investment, partnership, solution, value proposition, empower, unlock, elevate).
* Realtor and client messages end with:

```
Best,
Jerry
☎️ 917-400-9292
```

## Response format for code work

The Problem, The Solution, Files Changed, Validation (only checks actually run), Deploy. Always give a confidence level. Below 0.90, say what is missing instead of shipping.

## Open items

1. 11 sold comps from the verified spreadsheet still need year, beds, baths, sqft, zpid before they can go in: 275 Selig Rd, 1827 Stag Run, 276 Mountain View Dr, 136 Netcong Cir, 286 Fawn Rd, 111 Hillside Ter, 104 White Pine Dr, 1520 Lake Ln (LLV), 3145 Ogontz Dr, 112 Moshannon Dr, 117 Shawnee Dr (Arrowhead). Their sale facts are in the spreadsheet.
2. Active listings are a May 2026 snapshot. Refresh or retire them.
3. Adjusted Comp Value in the Max Offer Calculator is a hand set $345K. Could be calibrated live from the sold set.
4. 6 active comps link to Zillow search pages instead of a zpid detail page.
5. Mobile check on a real iPhone for the tornado, heatmap, and underwriting table.
