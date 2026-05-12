// merger.test.js — Tests unitaires du module merger
import { describe, it, expect } from 'vitest';
import { computeCardIdentity, merge } from '../../js/merger.js';

/**
 * Helper: crée une entrée Moxfield minimale.
 */
function makeEntry(overrides = {}) {
  return {
    count: 1,
    name: 'Test Card',
    edition: 'tst',
    condition: 'Near Mint',
    language: 'English',
    foil: '',
    collectorNumber: '1',
    alter: '',
    playtestCard: '',
    purchasePrice: '',
    ...overrides,
  };
}

describe('computeCardIdentity', () => {
  it('deux entrées identiques → même clé', () => {
    const a = makeEntry();
    const b = makeEntry();
    expect(computeCardIdentity(a)).toBe(computeCardIdentity(b));
  });

  it('edition en casse différente → même clé (normalisation lowercase)', () => {
    const a = makeEntry({ edition: 'AKH' });
    const b = makeEntry({ edition: 'akh' });
    expect(computeCardIdentity(a)).toBe(computeCardIdentity(b));
  });

  it('foil différent → clés différentes', () => {
    const a = makeEntry({ foil: '' });
    const b = makeEntry({ foil: 'foil' });
    expect(computeCardIdentity(a)).not.toBe(computeCardIdentity(b));
  });

  it('condition différente → même clé (condition ignorée dans l\'identité)', () => {
    const a = makeEntry({ condition: 'Near Mint' });
    const b = makeEntry({ condition: 'Lightly Played' });
    expect(computeCardIdentity(a)).toBe(computeCardIdentity(b));
  });

  it('name différent → clés différentes', () => {
    const a = makeEntry({ name: 'Card A' });
    const b = makeEntry({ name: 'Card B' });
    expect(computeCardIdentity(a)).not.toBe(computeCardIdentity(b));
  });

  it('collectorNumber différent → clés différentes', () => {
    const a = makeEntry({ collectorNumber: '1' });
    const b = makeEntry({ collectorNumber: '2' });
    expect(computeCardIdentity(a)).not.toBe(computeCardIdentity(b));
  });

  it('language différente → clés différentes', () => {
    const a = makeEntry({ language: 'English' });
    const b = makeEntry({ language: 'French' });
    expect(computeCardIdentity(a)).not.toBe(computeCardIdentity(b));
  });

  it('condition en casse différente → même clé (condition ignorée)', () => {
    const a = makeEntry({ condition: 'Near Mint' });
    const b = makeEntry({ condition: 'near mint' });
    expect(computeCardIdentity(a)).toBe(computeCardIdentity(b));
  });
});

describe('merge', () => {
  it('carte uniquement dans DS → présente dans merged et diffForMox', () => {
    const dsEntries = [makeEntry({ name: 'DS Only Card' })];
    const moxEntries = [];

    const result = merge(dsEntries, moxEntries);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].name).toBe('DS Only Card');
    expect(result.diffForMox).toHaveLength(1);
    expect(result.diffForMox[0].name).toBe('DS Only Card');
    expect(result.diffForDS).toHaveLength(0);
  });

  it('carte uniquement dans Mox → présente dans merged et diffForDS', () => {
    const dsEntries = [];
    const moxEntries = [makeEntry({ name: 'Mox Only Card' })];

    const result = merge(dsEntries, moxEntries);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].name).toBe('Mox Only Card');
    expect(result.diffForDS).toHaveLength(1);
    expect(result.diffForDS[0].name).toBe('Mox Only Card');
    expect(result.diffForMox).toHaveLength(0);
  });

  it('doublon avec DS.count > Mox.count → merged a max, diffForMox a la différence', () => {
    const dsEntries = [makeEntry({ count: 4 })];
    const moxEntries = [makeEntry({ count: 2 })];

    const result = merge(dsEntries, moxEntries);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].count).toBe(4);
    expect(result.diffForMox).toHaveLength(1);
    expect(result.diffForMox[0].count).toBe(2); // 4 - 2
    expect(result.diffForDS).toHaveLength(0);
  });

  it('doublon avec Mox.count > DS.count → merged a max, diffForDS a la différence', () => {
    const dsEntries = [makeEntry({ count: 1 })];
    const moxEntries = [makeEntry({ count: 3 })];

    const result = merge(dsEntries, moxEntries);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].count).toBe(3);
    expect(result.diffForDS).toHaveLength(1);
    expect(result.diffForDS[0].count).toBe(2); // 3 - 1
    expect(result.diffForMox).toHaveLength(0);
  });

  it('doublon avec DS.count == Mox.count → merged a la quantité, pas de diff', () => {
    const dsEntries = [makeEntry({ count: 2 })];
    const moxEntries = [makeEntry({ count: 2 })];

    const result = merge(dsEntries, moxEntries);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].count).toBe(2);
    expect(result.diffForMox).toHaveLength(0);
    expect(result.diffForDS).toHaveLength(0);
  });

  it('doublon → l\'entrée merged utilise les données Moxfield comme base', () => {
    const dsEntries = [makeEntry({ count: 3, purchasePrice: '5.00', alter: 'TRUE' })];
    const moxEntries = [makeEntry({ count: 1, purchasePrice: '2.50', alter: '' })];

    const result = merge(dsEntries, moxEntries);
    expect(result.merged[0].count).toBe(3); // max
    expect(result.merged[0].purchasePrice).toBe('2.50'); // Mox base
    expect(result.merged[0].alter).toBe(''); // Mox base
  });

  it('collections vides → résultat vide', () => {
    const result = merge([], []);
    expect(result.merged).toHaveLength(0);
    expect(result.diffForMox).toHaveLength(0);
    expect(result.diffForDS).toHaveLength(0);
    expect(result.report.totalDS).toBe(0);
    expect(result.report.totalMox).toBe(0);
    expect(result.report.duplicates).toBe(0);
    expect(result.report.totalOutput).toBe(0);
    expect(result.report.dsOnly).toBe(0);
    expect(result.report.moxOnly).toBe(0);
  });

  it('DS vide → output = Mox, diffForDS = toutes les cartes Mox', () => {
    const moxEntries = [
      makeEntry({ name: 'Card A', collectorNumber: '1' }),
      makeEntry({ name: 'Card B', collectorNumber: '2' }),
    ];
    const result = merge([], moxEntries);
    expect(result.merged).toHaveLength(2);
    expect(result.diffForDS).toHaveLength(2);
    expect(result.diffForMox).toHaveLength(0);
  });

  it('Mox vide → output = DS, diffForMox = toutes les cartes DS', () => {
    const dsEntries = [
      makeEntry({ name: 'Card A', collectorNumber: '1' }),
      makeEntry({ name: 'Card B', collectorNumber: '2' }),
    ];
    const result = merge(dsEntries, []);
    expect(result.merged).toHaveLength(2);
    expect(result.diffForMox).toHaveLength(2);
    expect(result.diffForDS).toHaveLength(0);
  });

  it('rapport : cohérence mathématique des compteurs', () => {
    const dsEntries = [
      makeEntry({ name: 'Card A', collectorNumber: '1', count: 3 }),
      makeEntry({ name: 'Card B', collectorNumber: '2', count: 2 }),
      makeEntry({ name: 'DS Only', collectorNumber: '3', count: 1 }),
    ];
    const moxEntries = [
      makeEntry({ name: 'Card A', collectorNumber: '1', count: 1 }),
      makeEntry({ name: 'Card B', collectorNumber: '2', count: 5 }),
      makeEntry({ name: 'Mox Only', collectorNumber: '4', count: 2 }),
    ];

    const result = merge(dsEntries, moxEntries);
    const { report } = result;

    // totalDS = 3 + 2 + 1 = 6
    expect(report.totalDS).toBe(6);
    // totalMox = 1 + 5 + 2 = 8
    expect(report.totalMox).toBe(8);
    // duplicates = 2 (Card A, Card B)
    expect(report.duplicates).toBe(2);
    // dsOnly = 1 (DS Only)
    expect(report.dsOnly).toBe(1);
    // moxOnly = 1 (Mox Only)
    expect(report.moxOnly).toBe(1);
    // totalOutput = max(3,1) + max(2,5) + 1 + 2 = 3 + 5 + 1 + 2 = 11
    expect(report.totalOutput).toBe(11);

    // Invariant: dsOnly + moxOnly + duplicates = number of distinct entries in merged
    expect(report.dsOnly + report.moxOnly + report.duplicates).toBe(result.merged.length);
  });

  it('fusion avec edition en casse mixte → identifiés comme doublons', () => {
    const dsEntries = [makeEntry({ edition: 'AKH' })];
    const moxEntries = [makeEntry({ edition: 'akh' })];

    const result = merge(dsEntries, moxEntries);
    expect(result.merged).toHaveLength(1);
    expect(result.report.duplicates).toBe(1);
  });
});
