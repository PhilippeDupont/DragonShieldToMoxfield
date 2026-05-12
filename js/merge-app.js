// merge-app.js — Contrôleur de l'onglet fusion

import { parseCSV } from './parser.js';
import { mapEntries } from './mapper.js';
import { writeCSV } from './writer.js';
import { readFile, createDownloadURL, MAX_FILE_SIZE } from './file-handler.js';
import { parseMoxfieldCSV } from './mox-parser.js';
import { merge } from './merger.js';
import { t } from './i18n.js';

/** @type {File|null} */
let dsFile = null;

/** @type {File|null} */
let moxFile = null;

/**
 * Initialise l'onglet fusion : attache les événements UI.
 */
export function initMergeTab() {
  const dropZoneDS = document.getElementById('drop-zone-ds');
  const dropZoneMox = document.getElementById('drop-zone-mox');
  const fileInputDS = document.getElementById('file-input-ds');
  const fileInputMox = document.getElementById('file-input-mox');
  const mergeBtn = document.getElementById('merge-action-btn');

  // DS drop zone — click
  dropZoneDS.addEventListener('click', (e) => {
    if (e.target.closest('label')) return;
    fileInputDS.click();
  });
  dropZoneDS.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputDS.click();
    }
  });

  // Mox drop zone — click
  dropZoneMox.addEventListener('click', (e) => {
    if (e.target.closest('label')) return;
    fileInputMox.click();
  });
  dropZoneMox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputMox.click();
    }
  });

  // File input change
  fileInputDS.addEventListener('change', () => {
    if (fileInputDS.files.length > 0) {
      setDSFile(fileInputDS.files[0]);
    }
  });
  fileInputMox.addEventListener('change', () => {
    if (fileInputMox.files.length > 0) {
      setMoxFile(fileInputMox.files[0]);
    }
  });

  // Drag & drop — DS
  setupDropZone(dropZoneDS, (file) => setDSFile(file));

  // Drag & drop — Mox
  setupDropZone(dropZoneMox, (file) => setMoxFile(file));

  // Merge button
  mergeBtn.addEventListener('click', handleMerge);
}

/**
 * Configure les événements drag & drop pour une zone.
 * @param {HTMLElement} zone
 * @param {(file: File) => void} onFile
 */
function setupDropZone(zone, onFile) {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.add('drop-zone--active');
  });
  zone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.add('drop-zone--active');
  });
  zone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('drop-zone--active');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove('drop-zone--active');
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.toLowerCase().endsWith('.csv')
    );
    if (files.length > 0) {
      onFile(files[0]);
    }
  });
}

/**
 * Met à jour le fichier DS sélectionné.
 * @param {File} file
 */
function setDSFile(file) {
  dsFile = file;
  const nameEl = document.getElementById('ds-file-name');
  nameEl.textContent = file.name;
  nameEl.hidden = false;
  updateMergeButton();
}

/**
 * Met à jour le fichier Mox sélectionné.
 * @param {File} file
 */
function setMoxFile(file) {
  moxFile = file;
  const nameEl = document.getElementById('mox-file-name');
  nameEl.textContent = file.name;
  nameEl.hidden = false;
  updateMergeButton();
}

/**
 * Active/désactive le bouton de fusion.
 */
function updateMergeButton() {
  const mergeBtn = document.getElementById('merge-action-btn');
  mergeBtn.disabled = !(dsFile && moxFile);
}

/**
 * Gère le lancement de la fusion.
 */
async function handleMerge() {
  const mergeBtn = document.getElementById('merge-action-btn');
  const resultsSection = document.getElementById('merge-results-section');
  const reportEl = document.getElementById('merge-report');
  const downloadsEl = document.getElementById('merge-downloads');
  const errorsEl = document.getElementById('merge-errors');

  // Reset
  reportEl.innerHTML = '';
  downloadsEl.innerHTML = '';
  errorsEl.innerHTML = '';
  resultsSection.hidden = true;

  mergeBtn.disabled = true;
  mergeBtn.textContent = t('merging');

  try {
    // Check file sizes
    if (dsFile.size > MAX_FILE_SIZE) {
      throw new Error(`Le fichier "${dsFile.name}" dépasse la taille maximale autorisée (50 Mo).`);
    }
    if (moxFile.size > MAX_FILE_SIZE) {
      throw new Error(`Le fichier "${moxFile.name}" dépasse la taille maximale autorisée (50 Mo).`);
    }

    // Read DS file
    const dsText = await readFile(dsFile);

    // Parse DS
    let dsParseResult;
    try {
      dsParseResult = parseCSV(dsText);
    } catch (err) {
      throw new Error(`Le fichier DragonShield ne contient pas les colonnes requises : ${err.message}`);
    }

    // Map DS entries to Moxfield format
    const { mapped: dsEntries, warnings: mapWarnings } = mapEntries(dsParseResult.entries);

    // Read Mox file
    const moxText = await readFile(moxFile);

    // Parse Mox
    let moxParseResult;
    try {
      moxParseResult = parseMoxfieldCSV(moxText);
    } catch (err) {
      throw new Error(`Le fichier Moxfield ne contient pas la colonne requise : ${err.message}`);
    }

    // Merge
    const result = merge(dsEntries, moxParseResult.entries);

    // Write CSVs
    const mergedCSV = writeCSV(result.merged);
    const diffMoxCSV = result.diffForMox.length > 0 ? writeCSV(result.diffForMox) : null;
    const diffDSCSV = result.diffForDS.length > 0 ? writeCSV(result.diffForDS) : null;

    // Show results
    resultsSection.hidden = false;
    renderMergeReport(result.report, reportEl);
    renderDownloads(mergedCSV, diffMoxCSV, diffDSCSV, downloadsEl);

  } catch (err) {
    resultsSection.hidden = false;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'merge-error';
    errorDiv.textContent = err.message;
    errorsEl.appendChild(errorDiv);
  } finally {
    mergeBtn.disabled = !(dsFile && moxFile);
    mergeBtn.textContent = t('mergeBtn');
  }
}

/**
 * Affiche le rapport de fusion.
 * @param {MergeReport} report
 * @param {HTMLElement} container
 */
function renderMergeReport(report, container) {
  const grid = document.createElement('div');
  grid.className = 'merge-report-grid';

  const items = [
    { label: t('reportTotalDS'), value: report.totalDS },
    { label: t('reportTotalMox'), value: report.totalMox },
    { label: t('reportDuplicates'), value: report.duplicates },
    { label: t('reportTotalOutput'), value: report.totalOutput },
    { label: t('reportDsOnly'), value: report.dsOnly },
    { label: t('reportMoxOnly'), value: report.moxOnly },
  ];

  for (const item of items) {
    const div = document.createElement('div');
    div.className = 'merge-report-item';

    const label = document.createElement('span');
    label.className = 'merge-report-label';
    label.textContent = item.label;

    const value = document.createElement('span');
    value.className = 'merge-report-value';
    value.textContent = String(item.value);

    div.appendChild(label);
    div.appendChild(value);
    grid.appendChild(div);
  }

  container.appendChild(grid);
}

/**
 * Affiche les boutons de téléchargement.
 * @param {string} mergedCSV
 * @param {string|null} diffMoxCSV
 * @param {string|null} diffDSCSV
 * @param {HTMLElement} container
 */
function renderDownloads(mergedCSV, diffMoxCSV, diffDSCSV, container) {
  // Merged file — always present
  const mergedLink = createDownloadLink(mergedCSV, 'collection_merged.csv', t('downloadMergedFile'));
  container.appendChild(mergedLink);

  // Diff for Moxfield — only if non-empty
  if (diffMoxCSV) {
    const diffMoxLink = createDownloadLink(diffMoxCSV, 'ajout_moxfield.csv', t('downloadDiffMox'));
    container.appendChild(diffMoxLink);
  }

  // Diff for DragonShield — only if non-empty
  if (diffDSCSV) {
    const diffDSLink = createDownloadLink(diffDSCSV, 'ajout_dragonshield.csv', t('downloadDiffDS'));
    container.appendChild(diffDSLink);
  }
}

/**
 * Crée un lien de téléchargement.
 * @param {string} content
 * @param {string} filename
 * @param {string} label
 * @returns {HTMLAnchorElement}
 */
function createDownloadLink(content, filename, label) {
  const { url } = createDownloadURL(content, filename);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.className = 'btn btn--download';
  link.textContent = label;
  link.setAttribute('aria-label', label);
  return link;
}
