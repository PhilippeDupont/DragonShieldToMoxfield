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
    creatingZip: 'Création du ZIP…',
    download: 'Télécharger',
    cardsConverted: (n) => `${n} carte${n > 1 ? 's' : ''} convertie${n > 1 ? 's' : ''}`,
    unique: 'unique',
    duplicates: 'doublons',
    cards: 'cartes',
    warnings: (n) => `⚠ ${n} avertissement${n > 1 ? 's' : ''}`,
    disclaimer: 'DragonShield → Moxfield Converter is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
    langSwitch: 'EN',
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
    creatingZip: 'Creating ZIP…',
    download: 'Download',
    cardsConverted: (n) => `${n} card${n > 1 ? 's' : ''} converted`,
    unique: 'unique',
    duplicates: 'duplicates',
    cards: 'cards',
    warnings: (n) => `⚠ ${n} warning${n > 1 ? 's' : ''}`,
    disclaimer: 'DragonShield → Moxfield Converter is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
    langSwitch: 'FR',
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
