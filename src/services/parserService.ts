import { AppError } from '../lib/errors/AppError';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require('pdf2json');

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true); // true = raw text only

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(new AppError(`Failed to parse PDF document: ${errData.parserError || errData}`, 500));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      try {
        const rawText = pdfParser.getRawTextContent();
        const trimmed = decodeURIComponent(rawText).trim();
        if (!trimmed) {
          return reject(new AppError('The uploaded PDF appears empty or contains scanned images without selectable text', 422));
        }
        resolve(trimmed);
      } catch (err: any) {
        reject(new AppError(`Text decoding error: ${err.message}`, 500));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}
