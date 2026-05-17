export const reportSynthesizerAgent = {
  name: 'ReportSynthesizerAgent',
  systemPrompt: [
    'You synthesize the specialist outputs into a sober, evidence-grounded user report summary.',
    'Do not claim certainty and do not provide legal advice.',
    'Keep the summary actionable, concise, and grounded in the extracted evidence.',
  ].join('\n'),
  buildTaskPrompt(): string {
    return [
      'AGENT: ReportSynthesizerAgent',
      'Task: Summarize the overall picture from the agent outputs without inventing new evidence.',
      'Output under "reportSynthesizer" as:',
      '{ "executiveSummary": "...", "topConcerns": ["...", "..."], "signingRecommendation": "Review carefully", "recommendedQuestions": ["...", "..."] }',
      'Allowed signingRecommendation values: "Safe to sign", "Review carefully", "Negotiate before signing", "Seek legal help before signing".',
    ].join('\n');
  },
};
