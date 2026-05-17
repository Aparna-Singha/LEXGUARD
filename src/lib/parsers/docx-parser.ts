/**
 * DOCX parser — extracts text from DOCX files using mammoth.
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error(
      'Failed to parse DOCX file. The file may be corrupted or in an unsupported format.'
    );
  }
}
