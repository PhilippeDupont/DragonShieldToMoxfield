// writer.js — Génération du CSV au format Moxfield

const HEADER_COLUMNS = [
  'Count',
  'Name',
  'Edition',
  'Condition',
  'Language',
  'Foil',
  'Collector Number',
  'Alter',
  'Playtest Card',
  'Purchase Price'
];

/**
 * Échappe une valeur pour un champ CSV en doublant les guillemets internes.
 * @param {string} value
 * @returns {string} Valeur encadrée de guillemets doubles
 */
function escapeField(value) {
  const str = String(value);
  return '"' + str.replace(/"/g, '""') + '"';
}

/**
 * Génère une chaîne CSV au format Moxfield.
 * @param {MoxfieldEntry[]} entries
 * @returns {string} Contenu CSV complet avec en-tête
 */
export function writeCSV(entries) {
  const headerLine = HEADER_COLUMNS.map(col => escapeField(col)).join(',');

  const dataLines = entries.map(entry => {
    const fields = [
      entry.count,
      entry.name,
      entry.edition,
      entry.condition,
      entry.language,
      entry.foil,
      entry.collectorNumber,
      entry.alter,
      entry.playtestCard,
      entry.purchasePrice
    ];
    return fields.map(f => escapeField(f)).join(',');
  });

  return [headerLine, ...dataLines].join('\n') + '\n';
}
