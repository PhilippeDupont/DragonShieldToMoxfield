// merger.js — Logique de fusion de deux collections

/**
 * Calcule la clé d'identité d'une carte (6 champs normalisés).
 * @param {MoxfieldEntry} entry - Entrée au format Moxfield
 * @returns {string} Clé unique pour cette carte
 */
export function computeCardIdentity(entry) {
  const parts = [
    entry.name,
    entry.edition.toLowerCase(),
    entry.collectorNumber,
    entry.foil.toLowerCase(),
    entry.condition.toLowerCase(),
    entry.language.toLowerCase()
  ];
  return parts.join('||');
}

/**
 * Fusionne deux collections et produit le résultat complet.
 * @param {MoxfieldEntry[]} dsEntries - Entrées DS converties au format Moxfield
 * @param {MoxfieldEntry[]} moxEntries - Entrées Moxfield parsées
 * @returns {MergeResult}
 *
 * @typedef {Object} MergeResult
 * @property {MoxfieldEntry[]} merged - Collection fusionnée complète
 * @property {MoxfieldEntry[]} diffForMox - Cartes à ajouter dans Moxfield
 * @property {MoxfieldEntry[]} diffForDS - Cartes à ajouter dans DragonShield
 * @property {MergeReport} report - Statistiques de la fusion
 *
 * @typedef {Object} MergeReport
 * @property {number} totalDS - Nombre total de cartes (quantités) dans le DS_File
 * @property {number} totalMox - Nombre total de cartes (quantités) dans le Mox_File
 * @property {number} duplicates - Nombre de Card_Entry identifiées comme doublons
 * @property {number} totalOutput - Nombre total de cartes (quantités) dans l'Output_File
 * @property {number} dsOnly - Nombre de Card_Entry uniquement dans DS
 * @property {number} moxOnly - Nombre de Card_Entry uniquement dans Mox
 */
export function merge(dsEntries, moxEntries) {
  // Build Maps by cardIdentity
  const dsMap = new Map();
  for (const entry of dsEntries) {
    const key = computeCardIdentity(entry);
    dsMap.set(key, entry);
  }

  const moxMap = new Map();
  for (const entry of moxEntries) {
    const key = computeCardIdentity(entry);
    moxMap.set(key, entry);
  }

  const merged = [];
  const diffForMox = [];
  const diffForDS = [];

  let duplicates = 0;
  let dsOnly = 0;
  let moxOnly = 0;

  // Collect all unique keys (union)
  const allKeys = new Set([...dsMap.keys(), ...moxMap.keys()]);

  for (const key of allKeys) {
    const dsEntry = dsMap.get(key);
    const moxEntry = moxMap.get(key);

    if (dsEntry && !moxEntry) {
      // DS only
      merged.push({ ...dsEntry });
      diffForMox.push({ ...dsEntry });
      dsOnly++;
    } else if (!dsEntry && moxEntry) {
      // Mox only
      merged.push({ ...moxEntry });
      diffForDS.push({ ...moxEntry });
      moxOnly++;
    } else {
      // Both (duplicate)
      duplicates++;
      const maxCount = Math.max(dsEntry.count, moxEntry.count);
      // Use Mox entry as base, update count to max
      merged.push({ ...moxEntry, count: maxCount });

      if (dsEntry.count > moxEntry.count) {
        diffForMox.push({ ...moxEntry, count: dsEntry.count - moxEntry.count });
      } else if (moxEntry.count > dsEntry.count) {
        diffForDS.push({ ...moxEntry, count: moxEntry.count - dsEntry.count });
      }
    }
  }

  // Calculate report
  const totalDS = dsEntries.reduce((sum, e) => sum + e.count, 0);
  const totalMox = moxEntries.reduce((sum, e) => sum + e.count, 0);
  const totalOutput = merged.reduce((sum, e) => sum + e.count, 0);

  return {
    merged,
    diffForMox,
    diffForDS,
    report: {
      totalDS,
      totalMox,
      duplicates,
      totalOutput,
      dsOnly,
      moxOnly,
    },
  };
}
