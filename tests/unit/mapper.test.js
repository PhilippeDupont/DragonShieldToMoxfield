// mapper.test.js — Tests unitaires du module mapper
import { describe, it, expect } from 'vitest';
import { mapEntries } from '../../js/mapper.js';

/**
 * Helper pour créer une entrée CardEntry valide avec des valeurs par défaut.
 */
function makeEntry(overrides = {}) {
  return {
    folderName: 'TestFolder',
    quantity: 1,
    cardName: 'Test Card',
    setCode: 'TST',
    cardNumber: '42',
    condition: 'NearMint',
    printing: 'Normal',
    language: 'English',
    priceBought: 5.99,
    ...overrides,
  };
}

describe('mapEntries — Conditions', () => {
  it.each([
    ['Mint', 'Mint'],
    ['NearMint', 'Near Mint'],
    ['Excellent', 'Near Mint'],
    ['Good', 'Lightly Played'],
    ['LightlyPlayed', 'Lightly Played'],
    ['LightPlayed', 'Lightly Played'],
    ['Played', 'Played'],
    ['HeavilyPlayed', 'Heavily Played'],
    ['Poor', 'Damaged'],
    ['Damaged', 'Damaged'],
  ])('mappe la condition "%s" vers "%s"', (input, expected) => {
    const { mapped, warnings } = mapEntries([makeEntry({ condition: input })]);
    expect(mapped[0].condition).toBe(expected);
    expect(warnings).toHaveLength(0);
  });

  it('condition inconnue → "Near Mint" + warning', () => {
    const { mapped, warnings } = mapEntries([makeEntry({ condition: 'SuperRare' })]);
    expect(mapped[0].condition).toBe('Near Mint');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toMatch(/condition.*inconnue/i);
  });
});

describe('mapEntries — Langues', () => {
  it.each([
    'English', 'French', 'Japanese', 'Spanish', 'German',
    'Italian', 'Portuguese', 'Korean', 'Russian',
    'Simplified Chinese', 'Traditional Chinese',
    'Hebrew', 'Latin', 'Ancient Greek', 'Arabic', 'Sanskrit', 'Phyrexian',
  ])('mappe la langue "%s" correctement', (lang) => {
    const { mapped, warnings } = mapEntries([makeEntry({ language: lang })]);
    expect(mapped[0].language).toBe(lang);
    expect(warnings).toHaveLength(0);
  });

  it('langue inconnue → chaîne vide + warning', () => {
    const { mapped, warnings } = mapEntries([makeEntry({ language: 'Klingon' })]);
    expect(mapped[0].language).toBe('');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toMatch(/langue.*inconnue/i);
  });
});

describe('mapEntries — Foil (Printing)', () => {
  it.each([
    ['Normal', ''],
    ['Foil', 'foil'],
    ['Galaxy Foil', 'foil'],
    ['Etched', 'etched'],
  ])('mappe le printing "%s" vers "%s"', (input, expected) => {
    const { mapped, warnings } = mapEntries([makeEntry({ printing: input })]);
    expect(mapped[0].foil).toBe(expected);
    expect(warnings).toHaveLength(0);
  });

  it('printing inconnu → chaîne vide + warning', () => {
    const { mapped, warnings } = mapEntries([makeEntry({ printing: 'Holographic' })]);
    expect(mapped[0].foil).toBe('');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toMatch(/printing.*inconnu/i);
  });
});

describe('mapEntries — Édition', () => {
  it('met le setCode en minuscules', () => {
    const { mapped } = mapEntries([makeEntry({ setCode: 'AKH' })]);
    expect(mapped[0].edition).toBe('akh');
  });

  it('gère un setCode déjà en minuscules', () => {
    const { mapped } = mapEntries([makeEntry({ setCode: 'neo' })]);
    expect(mapped[0].edition).toBe('neo');
  });

  it('gère un setCode mixte', () => {
    const { mapped } = mapEntries([makeEntry({ setCode: 'MH3' })]);
    expect(mapped[0].edition).toBe('mh3');
  });
});

describe('mapEntries — Prix', () => {
  it('prix > 0 → arrondi à 2 décimales', () => {
    const { mapped } = mapEntries([makeEntry({ priceBought: 31.14 })]);
    expect(mapped[0].purchasePrice).toBe('31.14');
  });

  it('prix avec plus de 2 décimales → arrondi', () => {
    const { mapped } = mapEntries([makeEntry({ priceBought: 1.999 })]);
    expect(mapped[0].purchasePrice).toBe('2.00');
  });

  it('prix = 0 → chaîne vide', () => {
    const { mapped } = mapEntries([makeEntry({ priceBought: 0 })]);
    expect(mapped[0].purchasePrice).toBe('');
  });

  it('prix négatif → chaîne vide', () => {
    const { mapped } = mapEntries([makeEntry({ priceBought: -1 })]);
    expect(mapped[0].purchasePrice).toBe('');
  });
});

describe('mapEntries — Quantité', () => {
  it('reporte la quantité comme entier', () => {
    const { mapped } = mapEntries([makeEntry({ quantity: 5 })]);
    expect(mapped[0].count).toBe(5);
    expect(Number.isInteger(mapped[0].count)).toBe(true);
  });

  it('tronque une quantité décimale', () => {
    const { mapped } = mapEntries([makeEntry({ quantity: 3.7 })]);
    expect(mapped[0].count).toBe(3);
    expect(Number.isInteger(mapped[0].count)).toBe(true);
  });
});
