// mox-parser.js — Module de parsing CSV Moxfield

/**
 * Parse une ligne CSV en respectant les guillemets (RFC 4180).
 * Gère les champs entre guillemets contenant des virgules et des guillemets doublés.
 * @param {string} line - Une ligne CSV brute
 * @returns {string[]} Tableau des champs extraits
 */
function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  const len = line.length;

  while (i <= len) {
    if (i === len) {
      fields.push('');
      break;
    }

    if (line[i] === '"') {
      // Champ entre guillemets
      i++; // skip opening quote
      let value = '';
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') {
            // Guillemet doublé → un seul guillemet
            value += '"';
            i += 2;
          } else {
            // Fin du champ entre guillemets
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      // Skip comma separator (or end of line)
      if (i < len && line[i] === ',') {
        i++;
      }
    } else {
      // Champ non-guillemet
      let value = '';
      while (i < len && line[i] !== ',') {
        value += line[i];
        i++;
      }
      fields.push(value);
      // Skip comma separator
      if (i < len && line[i] === ',') {
        i++;
        // Si on est à la fin après la virgule, il y a un champ vide final
        if (i === len) {
          fields.push('');
        }
      } else {
        break;
      }
    }
  }

  return fields;
}

/**
 * Colonnes standard Moxfield à extraire.
 */
const STANDARD_COLUMNS = [
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
 * Parse un fichier CSV Moxfield et retourne un tableau d'entrées.
 * @param {string} csvText - Contenu brut du fichier CSV Moxfield
 * @returns {{ entries: MoxfieldEntry[], warnings: string[] }}
 * @throws {Error} Si la colonne "Name" est absente
 */
export function parseMoxfieldCSV(csvText) {
  const warnings = [];
  const entries = [];

  if (!csvText || csvText.trim() === '') {
    return { entries, warnings };
  }

  // Split into lines, handling both \r\n and \n
  const lines = csvText.split(/\r?\n/);

  // First line is the header (no "sep=," in Moxfield exports)
  if (lines.length === 0 || lines[0].trim() === '') {
    return { entries, warnings };
  }

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Build column index map
  const columnMap = {};
  for (let i = 0; i < headers.length; i++) {
    columnMap[headers[i].trim()] = i;
  }

  // Validate required column: Name
  if (!('Name' in columnMap)) {
    throw new Error('Le fichier Moxfield ne contient pas la colonne requise : Name');
  }

  // Parse data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }

    const fields = parseCSVLine(line);
    const lineNumber = i + 1; // 1-based line number for user-facing messages

    // Check if line has at least enough fields for the Name column
    if (fields.length <= columnMap['Name']) {
      warnings.push(`Ligne ${lineNumber} : format invalide, ligne ignorée`);
      continue;
    }

    // Extract values using column map
    const getValue = (colName) => {
      const idx = columnMap[colName];
      if (idx === undefined || idx >= fields.length) return '';
      return fields[idx];
    };

    const name = getValue('Name');
    if (!name) {
      warnings.push(`Ligne ${lineNumber} : nom de carte vide, ligne ignorée`);
      continue;
    }

    // Count: default to 1 if missing or invalid
    const countStr = getValue('Count');
    let count = parseInt(countStr, 10);
    if (isNaN(count) || count < 1) {
      count = 1;
      if (countStr && countStr.trim() !== '') {
        warnings.push(`Ligne ${lineNumber} : Count '${countStr}' invalide, défaut à 1`);
      }
    }

    // Condition: default to "Near Mint" if empty
    let condition = getValue('Condition').trim();
    if (!condition) {
      condition = 'Near Mint';
    }

    // Language: default to "English" if empty
    let language = getValue('Language').trim();
    if (!language) {
      language = 'English';
    }

    entries.push({
      count,
      name,
      edition: getValue('Edition').trim(),
      condition,
      language,
      foil: getValue('Foil').trim(),
      collectorNumber: getValue('Collector Number').trim(),
      alter: getValue('Alter').trim(),
      playtestCard: getValue('Playtest Card').trim(),
      purchasePrice: getValue('Purchase Price').trim(),
    });
  }

  return { entries, warnings };
}
