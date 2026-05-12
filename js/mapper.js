// mapper.js — Règles de mapping DragonShield → Moxfield

/**
 * Table de remapping des codes d'édition DragonShield → Scryfall/Moxfield.
 * Certains codes DragonShield ne sont pas reconnus par Moxfield.
 */
const EDITION_REMAP = {
  // Pas de remap nécessaire — les codes DragonShield correspondent aux codes Scryfall.
  // Les quelques cartes non reconnues par Moxfield (promos, Mystery Booster)
  // seront signalées comme erreurs à l'import mais n'affectent pas le reste.
};

/**
 * Noms de cartes à exclure (tokens, emblèmes — non supportés par Moxfield import).
 * @param {string} name
 * @returns {boolean} true si la carte doit être exclue
 */
export function isExcludedCard(name) {
  const lower = name.toLowerCase();
  return lower.endsWith(' token') || lower.endsWith(' emblem');
}

/**
 * Table de mapping des conditions DragonShield → Moxfield.
 */
const CONDITION_MAP = {
  'Mint': 'Mint',
  'NearMint': 'Near Mint',
  'Excellent': 'Near Mint',
  'Good': 'Lightly Played',
  'LightlyPlayed': 'Lightly Played',
  'LightPlayed': 'Lightly Played',
  'Played': 'Played',
  'HeavilyPlayed': 'Heavily Played',
  'Poor': 'Damaged',
  'Damaged': 'Damaged',
};

/**
 * Table de mapping du printing DragonShield → foil Moxfield.
 */
const PRINTING_MAP = {
  'Normal': '',
  'Foil': 'foil',
  'Galaxy Foil': 'foil',
  'Surge Foil': 'foil',
  'Etched': 'etched',
};

/**
 * Langues reconnues (identiques entre DragonShield et Moxfield).
 */
const RECOGNIZED_LANGUAGES = new Set([
  'English',
  'French',
  'Japanese',
  'Spanish',
  'German',
  'Italian',
  'Portuguese',
  'Korean',
  'Russian',
  'Simplified Chinese',
  'Traditional Chinese',
  'Hebrew',
  'Latin',
  'Ancient Greek',
  'Arabic',
  'Sanskrit',
  'Phyrexian',
]);

/**
 * Convertit un tableau d'entrées DragonShield en entrées Moxfield.
 * @param {CardEntry[]} entries
 * @returns {{ mapped: MoxfieldEntry[], warnings: string[] }}
 */
export function mapEntries(entries) {
  const mapped = [];
  const warnings = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const lineNum = i + 1;

    // Skip tokens and emblems (not supported by Moxfield import)
    if (isExcludedCard(entry.cardName)) {
      warnings.push(`Ligne ${lineNum} : '${entry.cardName}' est un token/emblème, exclu de la conversion`);
      continue;
    }

    // Condition mapping
    let condition;
    if (Object.prototype.hasOwnProperty.call(CONDITION_MAP, entry.condition)) {
      condition = CONDITION_MAP[entry.condition];
    } else {
      condition = 'Near Mint';
      warnings.push(`Ligne ${lineNum} : condition '${entry.condition}' inconnue, 'Near Mint' utilisé par défaut`);
    }

    // Language mapping
    let language;
    if (RECOGNIZED_LANGUAGES.has(entry.language)) {
      language = entry.language;
    } else {
      language = '';
      warnings.push(`Ligne ${lineNum} : langue '${entry.language}' inconnue, valeur ignorée`);
    }

    // Printing → foil mapping
    let foil;
    const printingValue = entry.printing || 'Normal';
    if (Object.prototype.hasOwnProperty.call(PRINTING_MAP, printingValue)) {
      foil = PRINTING_MAP[printingValue];
    } else {
      foil = '';
      warnings.push(`Ligne ${lineNum} : printing '${entry.printing}' inconnu, traité comme Normal`);
    }

    // Purchase price formatting
    let purchasePrice;
    if (entry.priceBought > 0) {
      purchasePrice = Number(entry.priceBought).toFixed(2);
    } else {
      purchasePrice = '';
    }

    mapped.push({
      count: Math.floor(Number(entry.quantity)),
      name: entry.cardName,
      edition: EDITION_REMAP[entry.setCode.toLowerCase()] || entry.setCode.toLowerCase(),
      condition,
      language,
      foil,
      collectorNumber: entry.cardNumber,
      alter: '',
      playtestCard: '',
      purchasePrice,
    });
  }

  return { mapped, warnings };
}
