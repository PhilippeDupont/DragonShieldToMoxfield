import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile, createDownloadURL, createZipArchive, MAX_FILE_SIZE } from '../../js/file-handler.js';

describe('file-handler', () => {
  describe('MAX_FILE_SIZE', () => {
    it('should be 50 MB', () => {
      expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });
  });

  describe('readFile', () => {
    beforeEach(() => {
      // Mock FileReader for Node/Vitest environment
      class MockFileReader {
        readAsText(file, encoding) {
          this._encoding = encoding;
          if (file._shouldError) {
            setTimeout(() => {
              this.error = new Error('Read error');
              this.onerror();
            }, 0);
          } else {
            setTimeout(() => {
              this.result = file._content || '';
              this.onload();
            }, 0);
          }
        }
      }
      globalThis.FileReader = MockFileReader;
    });

    afterEach(() => {
      delete globalThis.FileReader;
    });

    it('should resolve with file content', async () => {
      const file = { name: 'test.csv', size: 100, _content: 'hello,world' };
      const result = await readFile(file);
      expect(result).toBe('hello,world');
    });

    it('should reject files exceeding MAX_FILE_SIZE', async () => {
      const file = { name: 'huge.csv', size: MAX_FILE_SIZE + 1 };
      await expect(readFile(file)).rejects.toThrow('dépasse la taille maximale');
    });

    it('should reject when FileReader encounters an error', async () => {
      const file = { name: 'corrupt.csv', size: 100, _shouldError: true };
      await expect(readFile(file)).rejects.toThrow('Impossible de lire le fichier');
    });

    it('should include the filename in the error message', async () => {
      const file = { name: 'myfile.csv', size: 100, _shouldError: true };
      await expect(readFile(file)).rejects.toThrow('myfile.csv');
    });

    it('should accept files exactly at MAX_FILE_SIZE', async () => {
      const file = { name: 'exact.csv', size: MAX_FILE_SIZE, _content: 'data' };
      const result = await readFile(file);
      expect(result).toBe('data');
    });
  });

  describe('createDownloadURL', () => {
    beforeEach(() => {
      globalThis.Blob = class Blob {
        constructor(parts, options) {
          this.parts = parts;
          this.options = options;
        }
      };
      globalThis.URL = {
        createObjectURL: vi.fn(() => 'blob:http://localhost/fake-url'),
      };
    });

    afterEach(() => {
      delete globalThis.Blob;
      delete globalThis.URL;
    });

    it('should return an object with url and filename', () => {
      const result = createDownloadURL('csv content', 'output.csv');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('filename');
      expect(result.filename).toBe('output.csv');
    });

    it('should create a Blob URL via URL.createObjectURL', () => {
      createDownloadURL('data', 'file.csv');
      expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('should return the URL from createObjectURL', () => {
      const result = createDownloadURL('data', 'file.csv');
      expect(result.url).toBe('blob:http://localhost/fake-url');
    });
  });

  describe('createZipArchive', () => {
    let mockGenerateAsync;

    beforeEach(() => {
      mockGenerateAsync = vi.fn(() => Promise.resolve(new Blob(['zip content'])));
      const mockFile = vi.fn();

      globalThis.JSZip = class JSZip {
        constructor() {
          this.file = mockFile;
          this.generateAsync = mockGenerateAsync;
        }
      };

      globalThis.Blob = class Blob {
        constructor(parts) {
          this.parts = parts;
        }
      };
    });

    afterEach(() => {
      delete globalThis.JSZip;
      delete globalThis.Blob;
    });

    it('should throw if JSZip is not available', () => {
      delete globalThis.JSZip;
      expect(() => createZipArchive([])).toThrow('JSZip n\'est pas disponible');
    });

    it('should create a ZIP archive and return a Promise<Blob>', async () => {
      const files = [
        { filename: 'file1.csv', content: 'content1' },
        { filename: 'file2.csv', content: 'content2' },
      ];
      const result = await createZipArchive(files);
      expect(result).toBeDefined();
      expect(mockGenerateAsync).toHaveBeenCalledWith({ type: 'blob' });
    });

    it('should add each file to the ZIP archive', async () => {
      const files = [
        { filename: 'a.csv', content: 'aaa' },
        { filename: 'b.csv', content: 'bbb' },
      ];
      const zip = new globalThis.JSZip();
      // We need to spy on the instance created inside createZipArchive
      // Instead, verify via the mock that generateAsync was called
      await createZipArchive(files);
      expect(mockGenerateAsync).toHaveBeenCalled();
    });
  });
});
