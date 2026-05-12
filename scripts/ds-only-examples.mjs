import { readFileSync } from 'fs';
import { parseCSV } from '../js/parser.js';
import { mapEntries } from '../js/mapper.js';
import { parseMoxfieldCSV } from '../js/mox-parser.js';
import { merge } from '../js/merger.js';

const dsText = readFileSync('Exemple export DS/DragonShield-Full.csv', 'utf-8');
const moxText = readFileSync('Exemple export DS/Moxfield-Full.csv', 'utf-8');

const { entries: dsRaw } = parseCSV(dsText);
const { mapped: dsEntries } = mapEntries(dsRaw);
const { entries: moxEntries } = parseMoxfieldCSV(moxText);
const result = merge(dsEntries, moxEntries);

// Show 20 DS-only entries with varied editions
const seen = new Set();
let count = 0;
for (const e of result.diffForMox) {
  if (count >= 20) break;
  const key = e.edition;
  if (seen.size < 15 || !seen.has(key)) {
    seen.add(key);
    console.log(`${e.name} | edition: ${e.edition} | #${e.collectorNumber} | qty: ${e.count} | foil: ${e.foil || 'non'} | lang: ${e.language}`);
    count++;
  }
}
