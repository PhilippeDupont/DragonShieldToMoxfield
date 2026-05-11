// writer.test.js — Tests unitaires du module writer
import { describe, it, expect } from 'vitest';
import { writeCSV } from '../../js/writer.js';

/**
 * Helper pour créer une MoxfieldEntry valide.
 */
function makeEntry(overrides = {}) {
  return {
    count: 1,
    name: 'Test Card',
    edition: 'tst',
    condition: 'Near Mint',
    language: 'English',
    foil: '',
    collectorNumber: '42',
    alter: '',
    playtestCard: '',
    purchasePrice: '5.99',
    ...overrides,
  };
}

describe('writeCSV', () => {
  it('produit un en-tête avec les 10 colonnes dans l\'ordre exact Moxfield', () => {
    const output = writeCSV([]);
    const headerLine = output.split('\n')[0];
    const expectedHeader = '"Count","Name","Edition","Condition","Language","Foil","Collector Number","Alter","Playtest Card","Purchase Price"';
    expect(headerLine).toBe(expectedHeader);
  });

  it('encadre chaque valeur de guillemets doubles', () => {
    const output = writeCSV([makeEntry()]);
    const dataLine = output.split('\n')[1];
    const fields = dataLine.split(',');
    for (const field of fields) {
      expect(field.startsWith('"')).toBe(true);
      expect(field.endsWith('"')).toBe(true);
    }
  });

  it('utilise la virgule comme séparateur', () => {
    const output = writeCSV([makeEntry()]);
    const dataLine = output.split('\n')[1];
    // 10 colonnes = 9 virgules séparatrices (en dehors des guillemets)
    // On vérifie que le split par regex donne 10 champs
    const fields = [];
    let i = 0;
    while (i < dataLine.length) {
      if (dataLine[i] === '"') {
        i++;
        let val = '';
        while (i < dataLine.length) {
          if (dataLine[i] === '"' && i + 1 < dataLine.length && dataLine[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (dataLine[i] === '"') {
            i++;
            break;
          } else {
            val += dataLine[i];
            i++;
          }
        }
        fields.push(val);
        if (i < dataLine.length && dataLine[i] === ',') i++;
      } else {
        i++;
      }
    }
    expect(fields).toHaveLength(10);
  });

  it('échappe les guillemets doubles dans les valeurs (doublés)', () => {
    const entry = makeEntry({ name: 'Card "Special" Edition' });
    const output = writeCSV([entry]);
    const dataLine = output.split('\n')[1];
    // Le nom doit contenir des guillemets doublés
    expect(dataLine).toContain('Card ""Special"" Edition');
  });

  it('une seule entrée → 2 lignes (en-tête + données)', () => {
    const output = writeCSV([makeEntry()]);
    const lines = output.trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('zéro entrées → 1 ligne (en-tête uniquement)', () => {
    const output = writeCSV([]);
    const lines = output.trim().split('\n');
    expect(lines).toHaveLength(1);
  });
});
