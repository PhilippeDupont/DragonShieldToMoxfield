// pipeline.test.js — Tests d'intégration du pipeline complet (parser → mapper → writer)
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../js/parser.js';
import { mapEntries } from '../../js/mapper.js';
import { writeCSV } from '../../js/writer.js';

// Subset of Baylen.csv (10 lines) for integration testing
const BAYLEN_CSV = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Baylen,1,0,Anointed Procession,AKH,Amonkhet,2,NearMint,Normal,French,31.14,2026-04-20,30.62,21.99,31.80
Baylen,1,0,Arasta of the Endless Web,THB,Theros Beyond Death,165,NearMint,Normal,English,0.33,2026-04-20,0.32,0.04,0.37
Baylen,1,0,Awaken the Woods,BRO,"The Brothers' War",170,NearMint,Foil,French,16.33,2026-04-20,15.00,9.77,16.21
Baylen,1,0,Collector Ouphe,PLST,The List,MH1-158,NearMint,Normal,English,4.06,2026-04-20,3.00,3.00,3.52
Baylen,1,0,"Eladamri's Call",TLE,Avatar: The Last Airbender Eternal,48,NearMint,Normal,English,7.28,2026-04-20,7.25,5.98,6.94
Baylen,1,0,"Elspeth, Storm Slayer",PTDM,Tarkir: Dragonstorm Promos,11s,NearMint,Foil,French,29.29,2026-04-20,39.59,35.00,31.92
Baylen,1,0,Grove of the Burnwillows,EOS,Edge of Eternities: Stellar Sights,107,NearMint,Galaxy Foil,English,19.65,2026-04-20,23.87,19.00,19.65
Baylen,1,0,"Jetmir's Garden",SNC,Streets of New Capenna,291,NearMint,Normal,French,18.33,2026-04-20,16.98,16.98,20.37
Baylen,1,0,"Warleader's Call",MKM,Murders at Karlov Manor,242,NearMint,Normal,English,5.58,2026-04-20,5.95,4.00,5.77`;

// Subset of tortues ninja.csv (mixed conditions/languages/foils)
const TORTUES_NINJA_CSV = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
tortues ninja,1,0,"Casey Jones, Vigilante",TMT,Teenage Mutant Ninja Turtles,88,NearMint,Normal,French,4.28,2026-04-21,1.91,0.30,1.84
tortues ninja,1,0,Changeling Outcast,MH1,Modern Horizons,82,NearMint,Normal,English,0.75,2026-04-20,0.80,0.20,0.85
tortues ninja,1,0,Dark Leo & Shredder,TMT,Teenage Mutant Ninja Turtles,289,NearMint,Foil,English,9.63,2026-04-21,10.92,8.75,10.52
tortues ninja,5,0,Forest,TMT,Teenage Mutant Ninja Turtles,195,NearMint,Normal,English,0.12,2026-04-21,0.25,0.02,0.20
tortues ninja,1,0,"Ink-Eyes, Servant of Oni",V13,From the Vault: Twenty,13,NearMint,Foil,English,7.38,2026-04-20,5.75,6.00,7.57
tortues ninja,1,0,Plains,TMT,Teenage Mutant Ninja Turtles,191,NearMint,Foil,French,0.25,2026-04-21,0.38,0.02,0.27
tortues ninja,1,0,"Karai, Future of the Foot",TMT,Teenage Mutant Ninja Turtles,151,NearMint,Normal,French,0.13,2026-04-21,0.10,0.02,0.15`;

describe('Pipeline de conversion complet', () => {
  it('convertit un fichier réel (Baylen.csv subset)', () => {
    const { entries } = parseCSV(BAYLEN_CSV);
    const { mapped } = mapEntries(entries);
    const output = writeCSV(mapped);

    // Verify header
    const lines = output.trim().split('\n');
    expect(lines[0]).toBe('"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"');

    // Verify data lines count
    expect(lines.length - 1).toBe(entries.length);

    // Verify first entry structure
    expect(mapped[0].count).toBe(1);
    expect(mapped[0].name).toBe('Anointed Procession');
    expect(mapped[0].edition).toBe('akh');
    expect(mapped[0].condition).toBe('Near Mint');
    expect(mapped[0].language).toBe('French');
    expect(mapped[0].foil).toBe('');
    expect(mapped[0].purchasePrice).toBe('31.14');
  });

  it('convertit un fichier avec conditions/langues/foils mixtes (tortues ninja)', () => {
    const { entries } = parseCSV(TORTUES_NINJA_CSV);
    const { mapped, warnings } = mapEntries(entries);
    const output = writeCSV(mapped);

    expect(mapped).toHaveLength(7);
    expect(warnings).toHaveLength(0);

    // French card
    const casey = mapped[0];
    expect(casey.name).toBe('Casey Jones, Vigilante');
    expect(casey.language).toBe('French');
    expect(casey.foil).toBe('');

    // English foil card
    const darkLeo = mapped[2];
    expect(darkLeo.name).toBe('Dark Leo & Shredder');
    expect(darkLeo.language).toBe('English');
    expect(darkLeo.foil).toBe('foil');

    // Quantity > 1
    const forest = mapped[3];
    expect(forest.count).toBe(5);

    // French foil
    const plains = mapped[5];
    expect(plains.language).toBe('French');
    expect(plains.foil).toBe('foil');

    // Output is valid CSV
    const lines = output.trim().split('\n');
    expect(lines).toHaveLength(8); // header + 7 data lines
  });

  it('préserve les noms de cartes avec virgules', () => {
    const { entries } = parseCSV(BAYLEN_CSV);
    const { mapped } = mapEntries(entries);
    const output = writeCSV(mapped);

    // Our CSV has 9 data lines (indices 0-8)
    expect(mapped).toHaveLength(9);

    // Eladamri's Call (has apostrophe) — index 4
    expect(mapped[4].name).toBe("Eladamri's Call");

    // Elspeth, Storm Slayer (has comma) — index 5
    expect(mapped[5].name).toBe('Elspeth, Storm Slayer');

    // Jetmir's Garden (has apostrophe) — index 7
    expect(mapped[7].name).toBe("Jetmir's Garden");

    // Warleader's Call (has apostrophe) — index 8
    expect(mapped[8].name).toBe("Warleader's Call");

    // Verify the output CSV can be re-parsed and names are preserved
    // The comma in "Elspeth, Storm Slayer" should be inside quotes
    expect(output).toContain('"Elspeth, Storm Slayer"');
  });

  it('préserve les numéros de collecteur spéciaux', () => {
    const { entries } = parseCSV(BAYLEN_CSV);
    const { mapped } = mapEntries(entries);

    // "11s" — promo collector number
    const elspeth = mapped[5];
    expect(elspeth.collectorNumber).toBe('11s');

    // "MH1-158" — The List collector number
    const ouphe = mapped[3];
    expect(ouphe.collectorNumber).toBe('MH1-158');
  });

  it('invariant du nombre de lignes (entrée = sortie)', () => {
    // Baylen
    const baylenResult = parseCSV(BAYLEN_CSV);
    const baylenMapped = mapEntries(baylenResult.entries);
    expect(baylenMapped.mapped).toHaveLength(baylenResult.entries.length);

    // Tortues ninja
    const tntResult = parseCSV(TORTUES_NINJA_CSV);
    const tntMapped = mapEntries(tntResult.entries);
    expect(tntMapped.mapped).toHaveLength(tntResult.entries.length);
  });

  it('re-parsing de la sortie (validité structurelle round-trip)', () => {
    const { entries } = parseCSV(BAYLEN_CSV);
    const { mapped } = mapEntries(entries);
    const output = writeCSV(mapped);

    // The output CSV should be structurally valid:
    // - Each line should have the same number of fields
    // - All fields should be properly quoted
    const lines = output.trim().split('\n');
    const headerFields = parseCSVLine(lines[0]);
    expect(headerFields).toHaveLength(10);

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      expect(fields).toHaveLength(10);
    }

    // Verify specific values survive the round-trip
    const firstDataFields = parseCSVLine(lines[1]);
    expect(firstDataFields[0]).toBe('1'); // Count
    expect(firstDataFields[1]).toBe('Anointed Procession'); // Name
    expect(firstDataFields[2]).toBe('akh'); // Edition
  });
});

/**
 * Simple CSV line parser for round-trip validation.
 * Handles quoted fields with escaped double quotes.
 */
function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    if (line[i] === '"') {
      i++; // skip opening quote
      let value = '';
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            value += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      if (i < len && line[i] === ',') {
        i++; // skip comma
      }
    } else {
      let value = '';
      while (i < len && line[i] !== ',') {
        value += line[i];
        i++;
      }
      fields.push(value);
      if (i < len && line[i] === ',') {
        i++; // skip comma
      }
    }
  }

  return fields;
}
