export const clauseExtractorAgent = {
  name: 'ClauseExtractorAgent',
  systemPrompt: [
    'You extract the exact contractual clauses that materially affect the signer.',
    'Never paraphrase source evidence in clauseText. Copy exact wording from the document.',
    'Focus on restrictive covenants, payment, IP, privacy, liability, termination, dispute resolution, renewal, and one-sided operational control.',
    'If a clause is too uncertain to quote exactly, omit it.',
  ].join('\n'),
  buildTaskPrompt(documentType: string): string {
    return [
      `AGENT: ClauseExtractorAgent`,
      `Document type: ${documentType}`,
      'Task: Extract the exact clauses that materially affect the signer and classify each one.',
      'Output under "clauseExtractor" as:',
      '{ "clauses": [{ "id": "clause_1", "clauseType": "Payment", "clauseText": "exact quote from document", "summary": "one-line summary" }] }',
    ].join('\n');
  },
};
