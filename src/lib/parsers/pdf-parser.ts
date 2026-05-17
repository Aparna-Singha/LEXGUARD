/**
 * PDF parser — extracts text from PDF buffers using pdfjs-dist.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const uint8 = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data: uint8, useSystemFonts: true }).promise;

    const textParts: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item) => 'str' in item)
        .map((item) => (item as { str: string }).str)
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n').trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(
      'Failed to parse PDF. The file may be corrupted, password-protected, or contain only images.'
    );
  }
}
