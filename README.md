# DragonShield → Moxfield Converter

A free web tool to convert and merge your [DragonShield MTG](https://www.dragonshield.com/) and [Moxfield](https://www.moxfield.com/) card collections.

**🌐 Use it now:** [https://philippedupont.github.io/DragonShieldToMoxfield/](https://philippedupont.github.io/DragonShieldToMoxfield/)

## Features

### Convert tab
- **Instant conversion** — Upload your DragonShield CSV, get a Moxfield-ready CSV in seconds
- **Multi-file support** — Convert multiple files at once, download individually, as a ZIP, or merged into one file
- **Drag & drop** — Drop your files directly onto the page

### Merge tab
- **Collection merger** — Compare your DragonShield and Moxfield collections side by side
- **Smart deduplication** — Identifies matching cards by name, edition, collector number, foil, and language (condition is ignored)
- **Three output files:**
  - Merged collection (all cards combined, max quantity for duplicates)
  - Cards to import into Moxfield (missing from Mox)
  - Cards to import into DragonShield (missing from DS, Moxfield format)
- **Merge report** — Shows totals, duplicates found, and cards unique to each source

### General
- **100% client-side** — Your data never leaves your browser. No server, no tracking, no cookies
- **Bilingual** — Automatically detects your browser language (French/English)
- **Works offline** — After the first visit, the app works without internet (Service Worker)
- **Mobile-friendly** — Responsive design, works on phone and tablet
- **Timestamped exports** — All downloaded files include a timestamp for easy versioning

## How it works

### Converting
1. Export your collection from the DragonShield MTG app as CSV
2. Open the converter → "Convert" tab
3. Drop your CSV file(s) or click "Select files"
4. Click "Convert"
5. Download the converted file(s) and import them into Moxfield

### Merging
1. Export your collection from DragonShield as CSV
2. Export your collection from Moxfield as CSV (Collection → Export)
3. Open the converter → "Merge" tab
4. Drop/select your DragonShield file on the left, Moxfield file on the right
5. Click "Merge"
6. Download the merged collection and/or the differential files

## Field mapping

### Conditions

| DragonShield | Moxfield |
|---|---|
| Mint | Mint |
| NearMint | Near Mint |
| Excellent | Near Mint |
| Good | Lightly Played |
| LightPlayed | Lightly Played |
| Played | Played |
| HeavilyPlayed | Heavily Played |
| Poor | Damaged |
| Damaged | Damaged |

### Finishes

| DragonShield | Moxfield |
|---|---|
| Normal | *(empty)* |
| Foil | foil |
| Galaxy Foil | foil |
| Surge Foil | foil |
| Etched | etched |

### Other fields

| DragonShield | Moxfield | Notes |
|---|---|---|
| Quantity | Count | Integer |
| Card Name | Name | Exact copy |
| Set Code | Edition | Lowercased |
| Language | Language | Direct mapping (17 languages) |
| Card Number | Collector Number | Exact copy (supports letters, ★) |
| Price Bought | Purchase Price | Rounded to 2 decimals |

### Exclusions
- **Tokens and emblems** are automatically excluded (not supported by Moxfield import)

## Development

```bash
# Install dependencies
npm install

# Run tests (125 tests)
npm test

# Run tests with coverage
npm run test:coverage
```

### Project structure

```
├── index.html              # Main page (tabs: Convert / Merge)
├── css/styles.css          # Styles (responsive, dark mode)
├── js/
│   ├── app.js              # Main controller + tab navigation
│   ├── parser.js           # DragonShield CSV parser
│   ├── mox-parser.js       # Moxfield CSV parser
│   ├── mapper.js           # Field mapping rules (conditions, foil, edition)
│   ├── merger.js           # Collection merge logic (identity, diff, report)
│   ├── merge-app.js        # Merge tab controller
│   ├── writer.js           # Moxfield CSV generator (10-col + 8-col for DS)
│   ├── file-handler.js     # File reading, downloads, ZIP
│   └── i18n.js             # FR/EN translations
├── sw.js                   # Service Worker (offline support)
└── tests/
    ├── unit/               # Unit tests (parser, mapper, writer, mox-parser, merger)
    ├── integration/        # Pipeline tests (convert + merge)
    └── security/           # XSS, malformed files, DoS protection
```

## Known limitations

- A few cards with promo edition codes (`ppre`, `pres`, `mb1`) may not be recognized by Moxfield import (~6 cards out of thousands). These can be added manually.
- DragonShield import expects "Moxfield" format — select "Moxfield" in the DragonShield app when importing the differential file.

## Disclaimer

DragonShield → Moxfield Converter is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

DragonShield is a trademark of Arcane Tinmen ApS. Moxfield is a trademark of Moxfield LLC. This tool is not affiliated with or endorsed by either company.

## License

ISC
