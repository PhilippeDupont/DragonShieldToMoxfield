// pipeline.test.js — Tests d'intégration du pipeline complet (parser → mapper → writer)
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../js/parser.js';
import { mapEntries } from '../../js/mapper.js';
import { writeCSV } from '../../js/writer.js';

describe('Pipeline de conversion complet', () => {
  it.todo('conversion d\'un fichier réel');
});
