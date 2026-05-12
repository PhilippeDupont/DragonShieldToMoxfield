import { readFileSync } from 'fs';
import { parseCSV } from '../js/parser.js';
import { mapEntries } from '../js/mapper.js';
import { parseMoxfieldCSV } from '../js/mox-parser.js';
import { merge, computeCardIdentity } from '../js/merger.js';

// Read files
const dsText = readFileSync('Exemple export DS/DragonShield-Full.csv', 'utf-8');
const moxText = readFileSync('Exemple export DS/Moxfield-Full.csv', 'utf-8');

// Parse DS
const dsResult = parseCSV(dsText);
console.log('DS parsed:', dsResult.entries.length, 'entries,', dsResult.warnings.length, 'warnings');
if (dsResult.warnings.length > 0) console.log('  DS warnings (first 5):', dsResult.warnings.slice(0, 5));

// Map DS
const { mapped: dsEntries, warnings: mapWarnings } = mapEntries(dsResult.entries);
console.log('DS mapped:', dsEntries.length, 'entries,', mapWarnings.length, 'warnings');
if (mapWarnings.length > 0) console.log('  Map warnings (first 5):', mapWarnings.slice(0, 5));

// Parse Mox
const moxResult = parseMoxfieldCSV(moxText);
console.log('Mox parsed:', moxResult.entries.length, 'entries,', moxResult.warnings.length, 'warnings');
if (moxResult.warnings.length > 0) console.log('  Mox warnings (first 5):', moxResult.warnings.slice(0, 5));

// Merge
const result = merge(dsEntries, moxResult.entries);
console.log('');
console.log('=== MERGE REPORT ===');
console.log('Total DS (quantités):', result.report.totalDS);
console.log('Total Mox (quantités):', result.report.totalMox);
console.log('Doublons identifiés:', result.report.duplicates);
console.log('Total fusionné (quantités):', result.report.totalOutput);
console.log('Uniquement DS:', result.report.dsOnly);
console.log('Uniquement Mox:', result.report.moxOnly);
console.log('Entrées merged:', result.merged.length);
console.log('Diff pour Mox:', result.diffForMox.length, 'entrées');
console.log('Diff pour DS:', result.diffForDS.length, 'entrées');

// Sanity check
console.log('');
console.log('=== SANITY CHECKS ===');
const sum = result.report.dsOnly + result.report.moxOnly + result.report.duplicates;
console.log('dsOnly + moxOnly + duplicates =', sum, '(should equal merged.length:', result.merged.length, ')');
console.log('Check:', sum === result.merged.length ? '✓ OK' : '✗ FAIL');

// Show first 10 duplicates with quantity comparison
console.log('');
console.log('=== EXEMPLES DE DOUBLONS (10 premiers) ===');
const dsMap = new Map();
for (const e of dsEntries) dsMap.set(computeCardIdentity(e), e);
const moxMap = new Map();
for (const e of moxResult.entries) moxMap.set(computeCardIdentity(e), e);

let shown = 0;
for (const entry of result.merged) {
  if (shown >= 10) break;
  const key = computeCardIdentity(entry);
  if (dsMap.has(key) && moxMap.has(key)) {
    const ds = dsMap.get(key);
    const mox = moxMap.get(key);
    console.log(`  ${entry.name} (${entry.edition} #${entry.collectorNumber}) DS:${ds.count} Mox:${mox.count} → Merged:${entry.count}`);
    shown++;
  }
}

// Show first 5 DS-only entries
console.log('');
console.log('=== EXEMPLES DS ONLY (5 premiers) ===');
for (let i = 0; i < Math.min(5, result.diffForMox.length); i++) {
  const e = result.diffForMox[i];
  console.log(`  ${e.name} (${e.edition} #${e.collectorNumber}) count:${e.count}`);
}

// Show first 5 Mox-only entries
console.log('');
console.log('=== EXEMPLES MOX ONLY (5 premiers) ===');
for (let i = 0; i < Math.min(5, result.diffForDS.length); i++) {
  const e = result.diffForDS[i];
  console.log(`  ${e.name} (${e.edition} #${e.collectorNumber}) count:${e.count}`);
}
