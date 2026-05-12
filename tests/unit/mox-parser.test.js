// mox-parser.test.js — Tests unitaires du module mox-parser
import { describe, it, expect } from 'vitest';
import { parseMoxfieldCSV } from '../../js/mox-parser.js';

describe('parseMoxfieldCSV', () => {
  it('parse un fichier Moxfield standard avec toutes les colonnes', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Anointed Procession","akh","Near Mint","French","","2","","FALSE",""
"4","Advanced Stitchwing","2x2","Near Mint","English","","36","","","0.21"`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(2);
    expect(warnings).toHaveLength(0);

    expect(entries[0]).toEqual({
      count: 1,
      name: 'Anointed Procession',
      edition: 'akh',
      condition: 'Near Mint',
      language: 'French',
      foil: '',
      collectorNumber: '2',
      alter: '',
      playtestCard: 'FALSE',
      purchasePrice: '',
    });

    expect(entries[1]).toEqual({
      count: 4,
      name: 'Advanced Stitchwing',
      edition: '2x2',
      condition: 'Near Mint',
      language: 'English',
      foil: '',
      collectorNumber: '36',
      alter: '',
      playtestCard: '',
      purchasePrice: '0.21',
    });
  });

  it('première ligne utilisée comme en-tête (pas de sep=,)', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Test Card","tst","Near Mint","English","","1","","",""`;

    const { entries } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('Test Card');
  });

  it('gère les champs entre guillemets (noms avec virgules)', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Adrix and Nev, Twincasters","c21","Near Mint","English","foil","9","","FALSE",""`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(1);
    expect(warnings).toHaveLength(0);
    expect(entries[0].name).toBe('Adrix and Nev, Twincasters');
    expect(entries[0].foil).toBe('foil');
  });

  it('colonnes dans un ordre différent → parsing correct', () => {
    const csv = `"Name","Count","Foil","Edition","Condition","Language","Collector Number","Alter","Playtest Card","Purchase Price"
"Test Card","3","foil","tst","Lightly Played","French","42","","",""`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(1);
    expect(warnings).toHaveLength(0);
    expect(entries[0].count).toBe(3);
    expect(entries[0].name).toBe('Test Card');
    expect(entries[0].foil).toBe('foil');
    expect(entries[0].edition).toBe('tst');
    expect(entries[0].condition).toBe('Lightly Played');
    expect(entries[0].language).toBe('French');
    expect(entries[0].collectorNumber).toBe('42');
  });

  it('colonnes supplémentaires (Tradelist Count, Tags, Last Modified) → ignorées', () => {
    const csv = `"Count","Tradelist Count","Name","Edition","Condition","Language","Foil","Tags","Last Modified","Collector Number","Alter","Proxy","Purchase Price"
"1","1","Test Card","tst","Near Mint","English","","","2024-04-17 14:22:03.497000","1","False","False",""`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(1);
    expect(warnings).toHaveLength(0);
    expect(entries[0].name).toBe('Test Card');
    expect(entries[0].count).toBe(1);
    expect(entries[0].edition).toBe('tst');
  });

  it('fichier vide → retourne un tableau vide sans erreur', () => {
    const { entries, warnings } = parseMoxfieldCSV('');
    expect(entries).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('fichier avec uniquement l\'en-tête → retourne un tableau vide', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });

  it('colonne "Name" absente → erreur descriptive', () => {
    const csv = `"Count","Edition","Condition","Language","Foil","Collector Number"
"1","tst","Near Mint","English","","1"`;

    expect(() => parseMoxfieldCSV(csv)).toThrow(/colonne requise.*Name/i);
  });

  it('Count absent ou invalide → défaut à 1 + warning', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"abc","Card A","tst","Near Mint","English","","1","","",""
"","Card B","tst","Near Mint","English","","2","","",""
"-1","Card C","tst","Near Mint","English","","3","","",""`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(3);
    expect(entries[0].count).toBe(1);
    expect(entries[1].count).toBe(1);
    expect(entries[2].count).toBe(1);
    // "abc" and "-1" should generate warnings
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('Condition vide → défaut à "Near Mint"', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Test Card","tst","","English","","1","","",""`;

    const { entries } = parseMoxfieldCSV(csv);
    expect(entries[0].condition).toBe('Near Mint');
  });

  it('Language vide → défaut à "English"', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Test Card","tst","Near Mint","","","1","","",""`;

    const { entries } = parseMoxfieldCSV(csv);
    expect(entries[0].language).toBe('English');
  });

  it('lignes malformées → warning + ligne ignorée', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Good Card","tst","Near Mint","English","","1","","",""
"bad line with not enough fields"
"1","Another Good Card","tst","Near Mint","English","","3","","",""`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('Good Card');
    expect(entries[1].name).toBe('Another Good Card');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('gère les guillemets doublés dans les valeurs', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"
"1","Card with ""quotes""","tst","Near Mint","English","","1","","",""`;

    const { entries } = parseMoxfieldCSV(csv);
    expect(entries[0].name).toBe('Card with "quotes"');
  });

  it('gère les retours chariot Windows (\\r\\n)', () => {
    const csv = `"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"\r\n"1","Test Card","tst","Near Mint","English","","1","","",""\r\n`;

    const { entries } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('Test Card');
  });

  it('parse le format réel Moxfield avec Tradelist Count et Proxy', () => {
    const csv = `"Count","Tradelist Count","Name","Edition","Condition","Language","Foil","Tags","Last Modified","Collector Number","Alter","Proxy","Purchase Price"
"1","1","________ Goblin","unf","Near Mint","English","","","2024-04-17 14:22:03.497000","107","False","False",""
"1","1","A Tale for the Ages","woe","Near Mint","French","","","2024-02-25 18:56:05.160000","34","False","False","0.16"`;

    const { entries, warnings } = parseMoxfieldCSV(csv);
    expect(entries).toHaveLength(2);
    expect(warnings).toHaveLength(0);
    expect(entries[0].name).toBe('________ Goblin');
    expect(entries[0].edition).toBe('unf');
    expect(entries[1].purchasePrice).toBe('0.16');
  });
});
