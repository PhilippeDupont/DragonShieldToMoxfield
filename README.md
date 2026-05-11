# DragonShield → Moxfield Converter

A free web tool to convert your [DragonShield MTG](https://www.dragonshield.com/) card collection CSV exports into the [Moxfield](https://www.moxfield.com/) CSV import format.

**🌐 Use it now:** [https://philippedupont.github.io/DragonShieldToMoxfield/](https://philippedupont.github.io/DragonShieldToMoxfield/)

## Features

- **Instant conversion** — Upload your DragonShield CSV, get a Moxfield-ready CSV in seconds
- **100% client-side** — Your data never leaves your browser. No server, no tracking, no cookies
- **Multi-file support** — Convert multiple files at once, download individually or as a ZIP
- **Drag & drop** — Drop your files directly onto the page
- **Bilingual** — Automatically detects your browser language (French/English)
- **Works offline** — After the first visit, the app works without internet (Service Worker)
- **Mobile-friendly** — Responsive design, works on phone and tablet

## How it works

1. Export your collection from the DragonShield MTG app as CSV
2. Open the converter in your browser
3. Drop your CSV file(s) or click "Select files"
4. Click "Convert"
5. Download the converted file(s) and import them into Moxfield

## Field mapping

| DragonShield | Moxfield | Notes |
|---|---|---|
| Quantity | Count | Integer |
| Card Name | Name | Exact copy |
| Set Code | Edition | Lowercased |
| Condition | Condition | NearMint → Near Mint, etc. |
| Language | Language | Direct mapping (17 languages) |
| Printing | Foil | Normal→"", Foil→"foil", Etched→"etched" |
| Card Number | Collector Number | Exact copy (supports letters, ★) |
| Price Bought | Purchase Price | Rounded to 2 decimals |
| — | Alter | Always empty |
| — | Playtest Card | Always empty |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Project structure

```
├── index.html          # Main page
├── css/styles.css      # Styles (responsive, dark mode)
├── js/
│   ├── app.js          # Main controller
│   ├── parser.js       # DragonShield CSV parser
│   ├── mapper.js       # Field mapping rules
│   ├── writer.js       # Moxfield CSV generator
│   ├── file-handler.js # File reading, downloads, ZIP
│   └── i18n.js         # FR/EN translations
├── sw.js               # Service Worker (offline support)
└── tests/              # Unit, integration & security tests
```

## Disclaimer

DragonShield → Moxfield Converter is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

DragonShield is a trademark of Arcane Tinmen ApS. Moxfield is a trademark of Moxfield LLC. This tool is not affiliated with or endorsed by either company.

## License

ISC
