/**
 * Plain-text parser — simplest parser, just reads the buffer as UTF-8.
 */
export async function parseTxt(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8').trim();
}
