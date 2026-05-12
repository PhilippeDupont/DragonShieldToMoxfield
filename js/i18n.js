// i18n.js — Internationalisation FR/EN

const translations = {
  fr: {
    title: 'DragonShield → Moxfield Converter',
    subtitle: 'Convertissez vos exports DragonShield de cartes Magic: The Gathering au format Moxfield, directement dans votre navigateur.',
    dropText: 'Glissez vos fichiers CSV ici',
    dropHint: 'ou',
    selectFiles: 'Sélectionner des fichiers',
    convert: 'Convertir',
    converting: 'Conversion en cours…',
    results: 'Résultats',
    downloadAll: 'Télécharger tout (ZIP)',
    downloadMerged: 'Télécharger tout (1 fichier)',
    creatingZip: 'Création du ZIP…',
    download: 'Télécharger',
    cardsConverted: (n) => `${n} carte${n > 1 ? 's' : ''} convertie${n > 1 ? 's' : ''}`,
    unique: 'unique',
    duplicates: 'doublons',
    cards: 'cartes',
    warnings: (n) => `⚠ ${n} avertissement${n > 1 ? 's' : ''}`,
    disclaimer: 'DragonShield → Moxfield Converter is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
    langSwitch: 'EN',
    // Merge tab
    tabConvert: 'Convertir',
    tabMerge: 'Fusionner',
    dropDS: 'Fichier DragonShield',
    dropMox: 'Fichier Moxfield',
    mergeBtn: 'Fusionner',
    merging: 'Fusion en cours…',
    mergeReport: 'Rapport de fusion',
    reportTotalDS: 'Cartes DragonShield',
    reportTotalMox: 'Cartes Moxfield',
    reportDuplicates: 'Doublons identifiés',
    reportTotalOutput: 'Cartes fusionnées',
    reportDsOnly: 'Uniquement dans DS',
    reportMoxOnly: 'Uniquement dans Mox',
    downloadMergedFile: 'Télécharger la collection fusionnée',
    downloadDiffMox: 'À importer dans Moxfield (manquantes)',
    downloadDiffDS: 'À importer dans DragonShield (format Moxfield)',
    mergeErrorDS: 'Impossible de lire le fichier DragonShield',
    mergeErrorMox: 'Impossible de lire le fichier Moxfield',
    convertInfo: 'Critères de conversion',
    convertInfoContent: `• Les tokens et emblèmes sont exclus (non supportés par Moxfield)
• Édition : convertie en minuscules (code Scryfall)
• Prix : arrondi à 2 décimales, 0 = vide
• Langues : toutes les langues Moxfield supportées (17)

Conditions :
  Mint → Mint
  NearMint → Near Mint
  Excellent → Near Mint
  Good → Lightly Played
  LightPlayed → Lightly Played
  Played → Played
  HeavilyPlayed → Heavily Played
  Poor → Damaged

Finitions :
  Normal → (vide)
  Foil → foil
  Galaxy Foil → foil
  Surge Foil → foil
  Etched → etched`,
    mergeInfo: 'Critères de fusion',
    mergeInfoContent: `• Deux cartes sont considérées identiques si elles ont le même nom, édition, numéro de collecteur, type de foil et langue (la condition est ignorée)
• Si une carte est dans les deux fichiers : on garde la quantité maximale
• Les tokens et emblèmes sont exclus
• Le fichier "À importer dans Moxfield" contient les cartes présentes dans DragonShield mais absentes de Moxfield
• Le fichier "À importer dans DragonShield" contient les cartes présentes dans Moxfield mais absentes de DragonShield
• Les conditions DragonShield sont converties vers l'échelle Moxfield avant comparaison`,
  },
  en: {
    title: 'DragonShield → Moxfield Converter',
    subtitle: 'Convert your DragonShield Magic: The Gathering card exports to Moxfield format, directly in your browser.',
    dropText: 'Drop your CSV files here',
    dropHint: 'or',
    selectFiles: 'Select files',
    convert: 'Convert',
    converting: 'Converting…',
    results: 'Results',
    downloadAll: 'Download all (ZIP)',
    downloadMerged: 'Download all (1 file)',
    creatingZip: 'Creating ZIP…',
    download: 'Download',
    cardsConverted: (n) => `${n} card${n > 1 ? 's' : ''} converted`,
    unique: 'unique',
    duplicates: 'duplicates',
    cards: 'cards',
    warnings: (n) => `⚠ ${n} warning${n > 1 ? 's' : ''}`,
    disclaimer: 'DragonShield → Moxfield Converter is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
    langSwitch: 'FR',
    // Merge tab
    tabConvert: 'Convert',
    tabMerge: 'Merge',
    dropDS: 'DragonShield File',
    dropMox: 'Moxfield File',
    mergeBtn: 'Merge',
    merging: 'Merging…',
    mergeReport: 'Merge Report',
    reportTotalDS: 'DragonShield cards',
    reportTotalMox: 'Moxfield cards',
    reportDuplicates: 'Duplicates found',
    reportTotalOutput: 'Merged cards',
    reportDsOnly: 'DS only',
    reportMoxOnly: 'Mox only',
    downloadMergedFile: 'Download merged collection',
    downloadDiffMox: 'Import to Moxfield (missing cards)',
    downloadDiffDS: 'Import to DragonShield (Moxfield format)',
    mergeErrorDS: 'Unable to read DragonShield file',
    mergeErrorMox: 'Unable to read Moxfield file',
    convertInfo: 'Conversion rules',
    convertInfoContent: `• Tokens and emblems are excluded (not supported by Moxfield)
• Edition: converted to lowercase (Scryfall code)
• Price: rounded to 2 decimals, 0 = empty
• Languages: all 17 Moxfield languages supported

Conditions:
  Mint → Mint
  NearMint → Near Mint
  Excellent → Near Mint
  Good → Lightly Played
  LightPlayed → Lightly Played
  Played → Played
  HeavilyPlayed → Heavily Played
  Poor → Damaged

Finishes:
  Normal → (empty)
  Foil → foil
  Galaxy Foil → foil
  Surge Foil → foil
  Etched → etched`,
    mergeInfo: 'Merge rules',
    mergeInfoContent: `• Two cards are considered identical if they share the same name, edition, collector number, foil type, and language (condition is ignored)
• If a card is in both files: the maximum quantity is kept
• Tokens and emblems are excluded
• "Import to Moxfield" file contains cards in DragonShield but missing from Moxfield
• "Import to DragonShield" file contains cards in Moxfield but missing from DragonShield
• DragonShield conditions are converted to Moxfield scale before comparison`,
  },
};

let currentLang = 'fr';

/** @type {Function[]} */
const onLangChangeCallbacks = [];

/**
 * Enregistre un callback appelé à chaque changement de langue.
 * @param {Function} cb
 */
export function onLangChange(cb) {
  onLangChangeCallbacks.push(cb);
}

/**
 * Détecte la langue du navigateur et retourne 'fr' ou 'en'.
 */
function detectLanguage() {
  const lang = navigator.language || navigator.userLanguage || 'en';
  return lang.startsWith('fr') ? 'fr' : 'en';
}

/**
 * Retourne la langue courante.
 * @returns {'fr'|'en'}
 */
export function getLang() {
  return currentLang;
}

/**
 * Retourne une traduction par clé.
 * @param {string} key
 * @returns {string|Function}
 */
export function t(key) {
  return translations[currentLang][key] || translations.en[key] || key;
}

/**
 * Applique les traductions à tous les éléments avec data-i18n.
 */
export function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = translations[currentLang][key];
    if (value && typeof value === 'string') {
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const value = translations[currentLang][key];
    if (value && typeof value === 'string') {
      el.setAttribute('aria-label', value);
    }
  });
}

/**
 * Bascule entre FR et EN.
 */
export function toggleLang() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  applyTranslations();
  onLangChangeCallbacks.forEach((cb) => cb());
}

/**
 * Initialise la langue (détection auto).
 */
export function initLang() {
  currentLang = detectLanguage();
  applyTranslations();
}
