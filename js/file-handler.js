// file-handler.js — Gestion de la lecture des fichiers et des téléchargements

/** Taille maximale de fichier acceptée : 50 Mo */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Lit un fichier via FileReader et retourne son contenu texte.
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`Le fichier "${file.name}" dépasse la taille maximale autorisée (50 Mo).`));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error(`Impossible de lire le fichier "${file.name}" : ${reader.error?.message || 'erreur inconnue'}.`));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Crée un Blob URL pour téléchargement direct.
 * @param {string} csvContent - Contenu CSV à télécharger
 * @param {string} filename - Nom du fichier de sortie
 * @returns {{ url: string, filename: string }} Objet contenant l'URL du Blob et le nom de fichier
 */
export function createDownloadURL(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return { url, filename };
}

/**
 * Crée une archive ZIP contenant plusieurs fichiers CSV.
 * Utilise JSZip chargé globalement via CDN (window.JSZip).
 * @param {{ filename: string, content: string }[]} files
 * @returns {Promise<Blob>}
 */
export function createZipArchive(files) {
  if (typeof globalThis.JSZip === 'undefined') {
    throw new Error('JSZip n\'est pas disponible. Vérifiez que la bibliothèque est chargée via CDN.');
  }

  const zip = new globalThis.JSZip();

  for (const file of files) {
    zip.file(file.filename, file.content);
  }

  return zip.generateAsync({ type: 'blob' });
}
