// merge-pipeline.test.js — Tests d'intégration du pipeline de fusion
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../js/parser.js';
import { mapEntries } from '../../js/mapper.js';
import { writeCSV } from '../../js/writer.js';
import { parseMoxfieldCSV } from '../../js/mox-parser.js';
import { merge, computeCardIdentity } from '../../js/merger.js';

// DS file with known cards
const DS_CSV = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Baylen,3,0,Anointed Procession,AKH,Amonkhet,2,NearMint,Normal,French,31.14,2026-04-20,30.62,21.99,31.80
Baylen,1,0,"Adrix and Nev, Twincasters",C21,Commander 2021,9,NearMint,Foil,English,5.00,2026-04-20,5.00,4.00,5.00
Baylen,2,0,Forest,TMT,Teenage Mutant Ninja Turtles,195,NearMint,Normal,English,0.12,2026-04-21,0.25,0.02,0.20
Baylen,1,0,DS Only Card,TST,Test Set,99,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

// Moxfield file with overlapping cards
const MOX_CSV = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Anointed Procession","akh","Near Mint","French","","2","","",""
"2","Adrix and Nev, Twincasters","c21","Near Mint","English","foil","9","","FALSE",""
"5","Forest","tmt","Near Mint","English","","195","","",""
"1","Mox Only Card","xyz","Near Mint","English","","1","","",""`;

// Disjoint collections
const DS_DISJOINT = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Test,1,0,Card A,TST,Test,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00
Test,2,0,Card B,TST,Test,2,NearMint,Foil,English,2.00,2026-01-01,2.00,2.00,2.00`;

const MOX_DISJOINT = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Card C","abc","Near Mint","English","","3","","",""
"3","Card D","def","Near Mint","French","","4","","",""`;

// Identical collections
const DS_IDENTICAL = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Test,2,0,Same Card,TST,Test,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

const MOX_IDENTICAL = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"2","Same Card","tst","Near Mint","English","","1","","",""`;

/**
 * Helper: run the full merge pipeline (DS parse → map → Mox parse → merge)
 */
function runMergePipeline(dsCsv, moxCsv) {
  const dsParseResult = parseCSV(dsCsv);
  const { mapped: dsEntries } = mapEntries(dsParseResult.entries);
  const moxParseResult = parseMoxfieldCSV(moxCsv);
  return merge(dsEntries, moxParseResult.entries);
}

describe('Pipeline de fusion — Intégration', () => {
  it('fusion avec doublons connus (quantité max conservée)', () => {
    const result = runMergePipeline(DS_CSV, MOX_CSV);

    // Anointed Procession: DS=3, Mox=1 → merged=3
    const anointed = result.merged.find(e => e.name === 'Anointed Procession');
    expect(anointed).toBeDefined();
    expect(anointed.count).toBe(3);

    // Adrix and Nev: DS=1, Mox=2 → merged=2
    const adrix = result.merged.find(e => e.name === 'Adrix and Nev, Twincasters');
    expect(adrix).toBeDefined();
    expect(adrix.count).toBe(2);

    // Forest: DS=2, Mox=5 → merged=5
    const forest = result.merged.find(e => e.name === 'Forest');
    expect(forest).toBeDefined();
    expect(forest.count).toBe(5);
  });

  it('fusion avec collections disjointes (output = concaténation)', () => {
    const result = runMergePipeline(DS_DISJOINT, MOX_DISJOINT);

    expect(result.merged).toHaveLength(4);
    expect(result.diffForMox).toHaveLength(2); // Card A, Card B
    expect(result.diffForDS).toHaveLength(2); // Card C, Card D
    expect(result.report.duplicates).toBe(0);
    expect(result.report.dsOnly).toBe(2);
    expect(result.report.moxOnly).toBe(2);
  });

  it('fusion avec collections identiques (diffs vides)', () => {
    const result = runMergePipeline(DS_IDENTICAL, MOX_IDENTICAL);

    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].count).toBe(2);
    expect(result.diffForMox).toHaveLength(0);
    expect(result.diffForDS).toHaveLength(0);
    expect(result.report.duplicates).toBe(1);
  });

  it('noms de cartes avec virgules préservés correctement', () => {
    const result = runMergePipeline(DS_CSV, MOX_CSV);

    const adrix = result.merged.find(e => e.name === 'Adrix and Nev, Twincasters');
    expect(adrix).toBeDefined();

    // Write to CSV and verify the name is properly quoted
    const csv = writeCSV(result.merged);
    expect(csv).toContain('"Adrix and Nev, Twincasters"');
  });

  it('invariant de cardinalité (entrées distinctes output = union des identités)', () => {
    const result = runMergePipeline(DS_CSV, MOX_CSV);

    // DS has 4 cards, Mox has 4 cards, 3 are duplicates → 5 distinct
    const dsParseResult = parseCSV(DS_CSV);
    const { mapped: dsEntries } = mapEntries(dsParseResult.entries);
    const moxParseResult = parseMoxfieldCSV(MOX_CSV);

    const dsKeys = new Set(dsEntries.map(e => computeCardIdentity(e)));
    const moxKeys = new Set(moxParseResult.entries.map(e => computeCardIdentity(e)));
    const unionSize = new Set([...dsKeys, ...moxKeys]).size;

    expect(result.merged.length).toBe(unionSize);
    expect(result.report.dsOnly + result.report.moxOnly + result.report.duplicates).toBe(unionSize);
  });

  it('vérification des fichiers diff corrects', () => {
    const result = runMergePipeline(DS_CSV, MOX_CSV);

    // DS Only Card → should be in diffForMox
    const dsOnlyInDiff = result.diffForMox.find(e => e.name === 'DS Only Card');
    expect(dsOnlyInDiff).toBeDefined();
    expect(dsOnlyInDiff.count).toBe(1);

    // Mox Only Card → should be in diffForDS
    const moxOnlyInDiff = result.diffForDS.find(e => e.name === 'Mox Only Card');
    expect(moxOnlyInDiff).toBeDefined();
    expect(moxOnlyInDiff.count).toBe(1);

    // Anointed Procession: DS=3, Mox=1 → diffForMox with count=2
    const anointedDiff = result.diffForMox.find(e => e.name === 'Anointed Procession');
    expect(anointedDiff).toBeDefined();
    expect(anointedDiff.count).toBe(2);

    // Forest: DS=2, Mox=5 → diffForDS with count=3
    const forestDiff = result.diffForDS.find(e => e.name === 'Forest');
    expect(forestDiff).toBeDefined();
    expect(forestDiff.count).toBe(3);

    // Adrix: DS=1, Mox=2 → diffForDS with count=1
    const adrixDiff = result.diffForDS.find(e => e.name === 'Adrix and Nev, Twincasters');
    expect(adrixDiff).toBeDefined();
    expect(adrixDiff.count).toBe(1);
  });
});
