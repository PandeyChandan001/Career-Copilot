import pdf from 'pdf-parse';
import { AppError } from '../lib/errors/AppError';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    let text = data.text;

    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    if (text.length < 50) {
      throw new AppError('The uploaded PDF contains no readable text or is scanned/corrupted.', 400);
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to parse PDF document.', 500);
  }
}
