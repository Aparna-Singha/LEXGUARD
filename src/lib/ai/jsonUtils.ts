import { generateText } from './client';

export class AIJsonParseError extends Error {
  rawResponse?: string;

  constructor(message: string, rawResponse?: string) {
    super(message);
    this.name = 'AIJsonParseError';
    this.rawResponse = rawResponse;
  }
}

interface GenerateAndParseJsonOptions<T> {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  label: string;
  retries?: number;
  repairWithModel?: boolean;
  validate?: (value: unknown) => value is T;
}

const JSON_REPAIR_SYSTEM = [
  'You repair broken JSON.',
  'Return valid JSON only.',
  'Do not add commentary, markdown, or explanation.',
  'Preserve the original meaning as closely as possible.',
].join('\n');

export async function generateAndParseJson<T>(
  options: GenerateAndParseJsonOptions<T>
): Promise<T> {
  const retries = Math.max(0, options.retries ?? 1);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const rawText = await generateText({
      prompt: options.prompt,
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      jsonMode: true,
    });

    try {
      return parseJsonWithRecovery(rawText, options.label, options.validate);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`${options.label} JSON parsing failed.`);

      if (!options.repairWithModel) {
        continue;
      }

      const repairedText = await generateText({
        prompt: buildJsonRepairPrompt(rawText),
        systemInstruction: JSON_REPAIR_SYSTEM,
        temperature: 0,
        maxTokens: options.maxTokens,
        jsonMode: true,
      });

      try {
        return parseJsonWithRecovery(repairedText, `${options.label} (repaired)`, options.validate);
      } catch (repairError) {
        lastError =
          repairError instanceof Error
            ? repairError
            : new Error(`${options.label} repaired JSON parsing failed.`);
      }
    }
  }

  throw lastError ?? new AIJsonParseError(`${options.label} JSON parsing failed.`);
}

export function parseJsonWithRecovery<T>(
  rawText: string,
  label: string,
  validate?: (value: unknown) => value is T
): T {
  const candidates = uniqueStrings([
    rawText.trim(),
    extractJsonCandidate(rawText),
    repairJsonString(rawText),
    repairJsonString(extractJsonCandidate(rawText) ?? ''),
  ]);

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate) as unknown;

      if (validate && !validate(parsed)) {
        continue;
      }

      return parsed as T;
    } catch {
      // Try the next candidate.
    }
  }

  throw new AIJsonParseError(`Unable to parse ${label} JSON response.`, rawText);
}

export function extractJsonCandidate(rawText: string): string | null {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const startIndex = findJsonStart(rawText);
  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaping = false;
  const opener = rawText[startIndex];
  const closer = opener === '{' ? '}' : ']';

  for (let index = startIndex; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === opener) {
      depth += 1;
    } else if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        return rawText.slice(startIndex, index + 1).trim();
      }
    }
  }

  return rawText.slice(startIndex).trim();
}

export function repairJsonString(rawText: string): string {
  return rawText
    .replace(/^\uFEFF/, '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

function buildJsonRepairPrompt(rawText: string): string {
  return [
    'Repair the following malformed JSON and return only the corrected JSON.',
    '',
    rawText,
  ].join('\n');
}

function findJsonStart(value: string): number {
  const objectStart = value.indexOf('{');
  const arrayStart = value.indexOf('[');

  if (objectStart === -1) {
    return arrayStart;
  }

  if (arrayStart === -1) {
    return objectStart;
  }

  return Math.min(objectStart, arrayStart);
}

function uniqueStrings(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    unique.push(value);
  }

  return unique;
}
