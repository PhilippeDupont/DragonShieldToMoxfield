// parser.js — Module de parsing CSV DragonShield

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
 * Colonnes requises pour le parsing (doivent être présentes dans l'en-tête).
 */
const REQUIRED_COLUMNS = ['Card Name', 'Quantity'];

/**
 * Colonnes à extraire du fichier source.
 */
const EXTRACT_COLUMNS = [
  'Folder Name',
  'Quantity',
  'Card Name',
  'Set Code',
  'Card Number',
  'Condition',
  'Printing',
  'Language',
  'Price Bought'
];

/**
 * Parse un fichier CSV DragonShield et retourne un tableau d'entrées.
 * @param {string} csvText - Contenu brut du fichier CSV
 * @returns {{ entries: CardEntry[], warnings: string[] }}
 *
 * @typedef {Object} CardEntry
 * @property {string} folderName
 * @property {number} quantity
 * @property {string} cardName
 * @property {string} setCode
 * @property {string} cardNumber
 * @property {string} condition
 * @property {string} printing
 * @property {string} language
 * @property {number} priceBought
 */
export function parseCSV(csvText) {
  const warnings = [];
  const entries = [];

  if (!csvText || csvText.trim() === '') {
    return { entries, warnings };
  }

  // Split into lines, handling both \r\n and \n
  const lines = csvText.split(/\r?\n/);

  let lineIndex = 0;

  // Ignore first line if it contains "sep=,"
  if (lines.length > 0 && lines[0].trim().replace(/^"?(.*?)"?$/, '$1') === 'sep=,') {
    lineIndex++;
  }

  // Next line is the header
  if (lineIndex >= lines.length || lines[lineIndex].trim() === '') {
    return { entries, warnings };
  }

  const headerLine = lines[lineIndex];
  lineIndex++;

  const headers = parseCSVLine(headerLine);

  // Build column index map
  const columnMap = {};
  for (let i = 0; i < headers.length; i++) {
    columnMap[headers[i].trim()] = i;
  }

  // Validate required columns
  const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in columnMap));
  if (missingColumns.length > 0) {
    throw new Error(`Colonnes requises manquantes : ${missingColumns.join(', ')}`);
  }

  // Parse data lines
  for (let i = lineIndex; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      continue;
    }

    const fields = parseCSVLine(line);
    const lineNumber = i + 1; // 1-based line number for user-facing messages

    // Check if line has enough fields (at least the required columns)
    const maxRequiredIndex = Math.max(
      ...EXTRACT_COLUMNS.map(col => columnMap[col] ?? -1).filter(idx => idx >= 0)
    );

    if (fields.length <= maxRequiredIndex) {
      warnings.push(`Ligne ${lineNumber} : format invalide, ligne ignorée`);
      continue;
    }

    // Extract values using column map
    const getValue = (colName) => {
      const idx = columnMap[colName];
      if (idx === undefined || idx >= fields.length) return '';
      return fields[idx];
    };

    const quantityStr = getValue('Quantity');
    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity)) {
      warnings.push(`Ligne ${lineNumber} : format invalide, ligne ignorée`);
      continue;
    }

    const priceBoughtStr = getValue('Price Bought');
    const priceBought = priceBoughtStr ? parseFloat(priceBoughtStr) : 0;

    entries.push({
      folderName: getValue('Folder Name'),
      quantity: quantity,
      cardName: getValue('Card Name'),
      setCode: getValue('Set Code'),
      cardNumber: getValue('Card Number'),
      condition: getValue('Condition'),
      printing: getValue('Printing'),
      language: getValue('Language'),
      priceBought: isNaN(priceBought) ? 0 : priceBought
    });
  }

  return { entries, warnings };
}
