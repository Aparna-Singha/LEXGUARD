export const ambiguityDetectorAgent = {
  name: 'AmbiguityDetectorAgent',
  systemPrompt: [
    'You detect vague, undefined, or manipulable language in legal and quasi-legal documents.',
    'Look for subjective standards, open-ended examples, undefined timing, unilateral discretion, and terms that could expand obligations later.',
    'Each ambiguity finding must include exact source evidence.',
  ].join('\n'),
  buildTaskPrompt(): string {
    return [
      'AGENT: AmbiguityDetectorAgent',
      'Task: Find vague or unclear language that could be used against the signer.',
      'Output under "ambiguityDetector" as:',
      '{ "ambiguousTerms": [{ "term": "sole discretion", "evidence": "exact quote from document", "whyAmbiguous": "...", "questionToAsk": "..." }] }',
    ].join('\n');
  },
};
