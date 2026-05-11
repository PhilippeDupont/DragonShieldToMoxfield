// parser.test.js — Tests unitaires du module parser
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../js/parser.js';

describe('parseCSV', () => {
  it('parse un fichier CSV standard avec toutes les colonnes', () => {
    const csv = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Baylen,1,0,Anointed Procession,AKH,Amonkhet,2,NearMint,Normal,French,31.14,2026-04-20,30.62,21.99,31.80
Baylen,1,0,Arasta of the Endless Web,THB,Theros Beyond Death,165,NearMint,Normal,English,0.33,2026-04-20,0.32,0.04,0.37`;

    const { entries, warnings } = parseCSV(csv);
    expect(entries).toHaveLength(2);
    expect(warnings).toHaveLength(0);

    expect(entries[0]).toEqual({
      folderName: 'Baylen',
      quantity: 1,
      cardName: 'Anointed Procession',
      setCode: 'AKH',
      cardNumber: '2',
      condition: 'NearMint',
      printing: 'Normal',
      language: 'French',
      priceBought: 31.14,
    });

    expect(entries[1]).toEqual({
      folderName: 'Baylen',
      quantity: 1,
      cardName: 'Arasta of the Endless Web',
      setCode: 'THB',
      cardNumber: '165',
      condition: 'NearMint',
      printing: 'Normal',
      language: 'English',
      priceBought: 0.33,
    });
  });

  it('ignore correctement la ligne "sep=,"', () => {
    const csvWithSep = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Baylen,1,0,Test Card,TST,Test Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

    const csvWithoutSep = `Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Baylen,1,0,Test Card,TST,Test Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

    const resultWith = parseCSV(csvWithSep);
    const resultWithout = parseCSV(csvWithoutSep);

    expect(resultWith.entries).toHaveLength(1);
    expect(resultWithout.entries).toHaveLength(1);
    expect(resultWith.entries[0].cardName).toBe('Test Card');
    expect(resultWithout.entries[0].cardName).toBe('Test Card');
  });

  it('gère les champs entre guillemets (noms avec virgules)', () => {
    const csv = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Baylen,1,0,"Eladamri's Call",TLE,Avatar: The Last Airbender Eternal,48,NearMint,Normal,English,7.28,2026-04-20,7.25,5.98,6.94
Baylen,1,0,"Casey Jones, Vigilante",TMT,Teenage Mutant Ninja Turtles,88,NearMint,Normal,French,4.28,2026-04-21,1.91,0.30,1.84`;

    const { entries, warnings } = parseCSV(csv);
    expect(entries).toHaveLength(2);
    expect(warnings).toHaveLength(0);
    expect(entries[0].cardName).toBe("Eladamri's Call");
    expect(entries[1].cardName).toBe('Casey Jones, Vigilante');
  });

  it('retourne un tableau vide pour un fichier vide', () => {
    const { entries, warnings } = parseCSV('');
    expect(entries).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('retourne un tableau vide pour null/undefined', () => {
    expect(parseCSV(null).entries).toHaveLength(0);
    expect(parseCSV(undefined).entries).toHaveLength(0);
  });

  it('retourne un tableau vide pour "sep=," + en-tête sans données', () => {
    const csv = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND`;

    const { entries, warnings } = parseCSV(csv);
    expect(entries).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('lance une erreur si les colonnes requises sont manquantes', () => {
    const csv = `"sep=,"
Folder Name,Trade Quantity,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought
Baylen,0,AKH,Amonkhet,2,NearMint,Normal,French,31.14`;

    expect(() => parseCSV(csv)).toThrow(/Colonnes requises manquantes/);
    expect(() => parseCSV(csv)).toThrow(/Card Name/);
    expect(() => parseCSV(csv)).toThrow(/Quantity/);
  });

  it('émet un warning et ignore les lignes malformées', () => {
    const csv = `"sep=,"
Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Baylen,1,0,Good Card,TST,Test Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00
Baylen,bad_quantity,0,Bad Card,TST,Test Set,2,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00
Baylen,1,0,Another Good Card,TST,Test Set,3,NearMint,Normal,English,2.00,2026-01-01,2.00,2.00,2.00`;

    const { entries, warnings } = parseCSV(csv);
    expect(entries).toHaveLength(2);
    expect(entries[0].cardName).toBe('Good Card');
    expect(entries[1].cardName).toBe('Another Good Card');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toMatch(/ligne ignorée/i);
  });
});
