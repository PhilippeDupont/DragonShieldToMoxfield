// app.js — Contrôleur principal, orchestration de la conversion CSV

import { parseCSV } from './parser.js';
import { mapEntries } from './mapper.js';
import { writeCSV } from './writer.js';
import { readFile, createDownloadURL, createZipArchive } from './file-handler.js';
import { initLang, toggleLang, t } from './i18n.js';

/** @type {File[]} */
let selectedFiles = [];

/** @type {{ filename: string, content: string }[]} */
let convertedFiles = [];

/**
 * Initialise l'application : attache les événements UI.
 */
export function init() {
  // Initialize i18n
  initLang();

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const convertBtn = document.getElementById('convert-btn');
  const zipBtn = document.getElementById('zip-btn');
  const langBtn = document.getElementById('lang-btn');

  // Language toggle
  langBtn.addEventListener('click', toggleLang);

  // Click on drop zone triggers file input
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('label')) return; // let label handle it
    fileInput.click();
  });

  // Keyboard support for drop zone
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      setFiles(Array.from(fileInput.files));
    }
  });

  // Drag & drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drop-zone--active');
  });

  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drop-zone--active');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drop-zone--active');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drop-zone--active');

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.toLowerCase().endsWith('.csv')
    );

    if (files.length > 0) {
      setFiles(files);
    }
  });

  // Convert button
  convertBtn.addEventListener('click', handleConvert);

  // ZIP button
  zipBtn.addEventListener('click', handleZipDownload);
}

/**
 * Met à jour la liste des fichiers sélectionnés et l'affichage.
 * @param {File[]} files
 */
function setFiles(files) {
  selectedFiles = files;
  convertedFiles = [];
  renderFileList();
  hideResults();

  const convertBtn = document.getElementById('convert-btn');
  convertBtn.disabled = selectedFiles.length === 0;
}

/**
 * Affiche la liste des fichiers sélectionnés.
 */
function renderFileList() {
  const fileListEl = document.getElementById('file-list');
  fileListEl.innerHTML = '';
  fileListEl.hidden = selectedFiles.length === 0;

  for (const file of selectedFiles) {
    const item = document.createElement('div');
    item.className = 'file-list__item';
    item.setAttribute('role', 'listitem');

    const nameEl = document.createElement('span');
    nameEl.className = 'file-list__name';
    nameEl.textContent = file.name;

    const sizeEl = document.createElement('span');
    sizeEl.className = 'file-list__size';
    sizeEl.textContent = formatFileSize(file.size);

    item.appendChild(nameEl);
    item.appendChild(sizeEl);
    fileListEl.appendChild(item);
  }
}

/**
 * Formate une taille de fichier en unité lisible.
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

/**
 * Cache la section de résultats.
 */
function hideResults() {
  const resultsSection = document.getElementById('results-section');
  resultsSection.hidden = true;
  document.getElementById('results-list').innerHTML = '';
  document.getElementById('download-all').hidden = true;
}

/**
 * Gère le clic sur le bouton de conversion.
 */
async function handleConvert() {
  const convertBtn = document.getElementById('convert-btn');
  convertBtn.disabled = true;
  convertBtn.textContent = t('converting');

  convertedFiles = [];
  const resultsSection = document.getElementById('results-section');
  const resultsList = document.getElementById('results-list');
  resultsList.innerHTML = '';
  resultsSection.hidden = false;

  for (const file of selectedFiles) {
    const result = await convertFile(file);
    renderResult(result);

    if (!result.error) {
      convertedFiles.push({ filename: result.filename, content: result.content });
    }
  }

  // Show ZIP button if multiple files converted
  const downloadAll = document.getElementById('download-all');
  downloadAll.hidden = convertedFiles.length <= 1;

  convertBtn.disabled = false;
  convertBtn.textContent = t('convert');
}

/**
 * Convertit un fichier source et retourne le résultat.
 * @param {File} file
 * @returns {Promise<ConversionResult>}
 *
 * @typedef {Object} ConversionResult
 * @property {string} filename - Nom du fichier de sortie
 * @property {string} content - Contenu CSV Moxfield
 * @property {string[]} warnings - Avertissements de conversion
 * @property {string|null} error - Erreur fatale éventuelle
 * @property {number} entryCount - Nombre de cartes converties
 */
export async function convertFile(file) {
  const baseName = file.name.replace(/\.csv$/i, '');
  const outputFilename = baseName + '_moxfield.csv';

  try {
    // Read file content
    const text = await readFile(file);

    // Parse CSV
    let parseResult;
    try {
      parseResult = parseCSV(text);
    } catch (err) {
      return {
        filename: outputFilename,
        content: '',
        warnings: [],
        error: `Le fichier "${file.name}" ne semble pas être un export DragonShield valide : ${err.message}`,
        entryCount: 0,
      };
    }

    // Map entries
    const { mapped, warnings: mapWarnings } = mapEntries(parseResult.entries);

    // Calculate total cards and duplicates
    const totalCards = mapped.reduce((sum, entry) => sum + entry.count, 0);
    const uniqueCards = mapped.length;
    const duplicates = totalCards - uniqueCards;

    // Write CSV
    const csvOutput = writeCSV(mapped);

    // Combine warnings
    const allWarnings = [...parseResult.warnings, ...mapWarnings];

    return {
      filename: outputFilename,
      content: csvOutput,
      warnings: allWarnings,
      error: null,
      entryCount: mapped.length,
      totalCards,
      uniqueCards,
      duplicates,
    };
  } catch (err) {
    return {
      filename: outputFilename,
      content: '',
      warnings: [],
      error: `Impossible de lire le fichier "${file.name}" : ${err.message}`,
      entryCount: 0,
    };
  }
}

/**
 * Affiche le résultat d'une conversion dans l'interface.
 * @param {ConversionResult} result
 */
function renderResult(result) {
  const resultsList = document.getElementById('results-list');
  const card = document.createElement('div');
  card.className = 'result-card ' + (result.error ? 'result-card--error' : 'result-card--success');
  card.setAttribute('role', 'listitem');

  // Header with icon and title
  const header = document.createElement('div');
  header.className = 'result-card__header';

  const icon = document.createElement('span');
  icon.className = 'result-card__icon ' + (result.error ? 'result-card__icon--error' : 'result-card__icon--success');
  icon.textContent = result.error ? '✗' : '✓';
  icon.setAttribute('aria-hidden', 'true');

  const title = document.createElement('span');
  title.className = 'result-card__title';
  title.textContent = result.filename;

  header.appendChild(icon);
  header.appendChild(title);
  card.appendChild(header);

  if (result.error) {
    // Error display
    const errorEl = document.createElement('div');
    errorEl.className = 'result-card__error';
    errorEl.textContent = result.error;
    card.appendChild(errorEl);
  } else {
    // Info line
    const info = document.createElement('div');
    info.className = 'result-card__info';
    let infoText = t('cardsConverted')(result.totalCards);
    if (result.duplicates > 0) {
      infoText += ` (${result.uniqueCards} ${t('unique')}, ${result.duplicates} ${t('duplicates')})`;
    }
    info.textContent = infoText;
    card.appendChild(info);

    // Warnings
    if (result.warnings.length > 0) {
      card.appendChild(renderWarnings(result.warnings));
    }

    // Download button
    const downloadDiv = document.createElement('div');
    downloadDiv.className = 'result-card__download';

    const { url } = createDownloadURL(result.content, result.filename);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = result.filename;
    downloadLink.className = 'btn btn--download';
    downloadLink.textContent = t('download');
    downloadLink.setAttribute('aria-label', `Télécharger ${result.filename}`);

    downloadDiv.appendChild(downloadLink);
    card.appendChild(downloadDiv);
  }

  resultsList.appendChild(card);
}

/**
 * Crée l'élément d'affichage des warnings (dépliable si > 5).
 * @param {string[]} warnings
 * @returns {HTMLElement}
 */
function renderWarnings(warnings) {
  const container = document.createElement('div');
  container.className = 'warnings';

  const collapsed = warnings.length > 5;

  const toggle = document.createElement('button');
  toggle.className = 'warnings__toggle';
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.textContent = t('warnings')(warnings.length);

  const list = document.createElement('ul');
  list.className = 'warnings__list';
  list.hidden = collapsed;

  for (const w of warnings) {
    const li = document.createElement('li');
    li.textContent = w;
    list.appendChild(li);
  }

  toggle.addEventListener('click', () => {
    const isHidden = list.hidden;
    list.hidden = !isHidden;
    toggle.setAttribute('aria-expanded', String(isHidden));
  });

  container.appendChild(toggle);
  container.appendChild(list);
  return container;
}

/**
 * Gère le téléchargement ZIP de tous les fichiers convertis.
 */
async function handleZipDownload() {
  const zipBtn = document.getElementById('zip-btn');
  zipBtn.disabled = true;
  zipBtn.textContent = t('creatingZip');

  try {
    const blob = await createZipArchive(convertedFiles);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'moxfield_export.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke after a short delay to allow download to start
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    // Display error in a simple way
    const downloadAll = document.getElementById('download-all');
    const errorMsg = document.createElement('p');
    errorMsg.style.color = 'var(--color-error)';
    errorMsg.textContent = 'Erreur lors de la création du ZIP : ' + err.message;
    downloadAll.appendChild(errorMsg);
  } finally {
    zipBtn.disabled = false;
    zipBtn.textContent = t('downloadAll');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  const swPath = new URL('sw.js', document.baseURI).href;
  navigator.serviceWorker.register(swPath).catch(() => {
    // Service Worker registration failed — app still works without it
  });
}
