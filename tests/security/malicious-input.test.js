// malicious-input.test.js — Tests de sécurité (XSS, DoS, fichiers malformés)
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../js/parser.js';
import { mapEntries } from '../../js/mapper.js';
import { writeCSV } from '../../js/writer.js';

describe('Sécurité — Injection XSS', () => {
  it('injection XSS via <script> dans un nom de carte → traité comme texte brut', () => {
    const csv = `Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Test,1,0,<script>alert('xss')</script>,TST,Test Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

    const { entries } = parseCSV(csv);
    const { mapped } = mapEntries(entries);
    const output = writeCSV(mapped);

    // The script tag should appear as-is in the output (plain text, no execution)
    expect(entries[0].cardName).toBe("<script>alert('xss')</script>");
    expect(mapped[0].name).toBe("<script>alert('xss')</script>");
    expect(output).toContain("<script>alert('xss')</script>");
  });

  it('attributs HTML (<img onerror="...">) → aucune interprétation', () => {
    const csv = `Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Test,1,0,"<img onerror=""alert(1)"" src=""x"">",TST,Test Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

    const { entries } = parseCSV(csv);
    const { mapped } = mapEntries(entries);
    const output = writeCSV(mapped);

    // The HTML should be treated as plain text
    expect(entries[0].cardName).toContain('<img');
    expect(entries[0].cardName).toContain('onerror');
    expect(mapped[0].name).toContain('<img');
    // Output preserves it as text
    expect(output).toContain('onerror');
  });
});

describe('Sécurité — Fichiers malformés', () => {
  it('fichier non-CSV (contenu binaire) → erreur descriptive, pas de crash', () => {
    // Simulate binary content (PNG header + random bytes)
    const binaryContent = '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01\x00\x00\x00\x01\x00';

    // The parser should throw a descriptive error (missing required columns)
    // This is the correct behavior: binary files are rejected with a clear message
    expect(() => parseCSV(binaryContent)).toThrow(/Colonnes requises manquantes/);
  });

  it('fichier avec caractères null (\\0) → gestion gracieuse', () => {
    const csv = `Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Test,1,0,Card\x00Name,TST,Test\x00Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

    // Should not throw
    expect(() => parseCSV(csv)).not.toThrow();

    const { entries } = parseCSV(csv);
    // The card should be parsed (null chars are just characters in the string)
    expect(entries).toHaveLength(1);
    expect(entries[0].cardName).toContain('Card');
  });

  it('fichier avec unicode malformé → pas d\'exception non catchée', () => {
    // Malformed UTF-8 sequences represented as string
    const csv = `Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Test,1,0,Card\uFFFD\uFFFEName,TST,Test Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

    expect(() => parseCSV(csv)).not.toThrow();

    const { entries } = parseCSV(csv);
    expect(entries).toHaveLength(1);
  });

  it('fichier avec des lignes extrêmement longues (>100KB) → gestion gracieuse', () => {
    // Create a line with a very long card name (>100KB)
    const longName = 'A'.repeat(110000);
    const csv = `Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Price Bought,Date Bought,AVG,LOW,TREND
Test,1,0,${longName},TST,Test Set,1,NearMint,Normal,English,1.00,2026-01-01,1.00,1.00,1.00`;

    // Should not freeze or throw
    expect(() => parseCSV(csv)).not.toThrow();

    const { entries } = parseCSV(csv);
    expect(entries).toHaveLength(1);
    expect(entries[0].cardName).toBe(longName);
  });
});
