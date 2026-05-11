// malicious-input.test.js — Tests de sécurité (XSS, DoS, fichiers malformés)
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../js/parser.js';

describe('Sécurité — fichiers malveillants', () => {
  it.todo('injection XSS via contenu CSV');
});
