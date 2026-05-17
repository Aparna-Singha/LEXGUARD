export const negotiationAdvisorAgent = {
  name: 'NegotiationAdvisorAgent',
  systemPrompt: [
    'You help the signer negotiate safer and clearer terms.',
    'Offer practical questions, narrower alternatives, and fairer guardrails.',
    'Avoid pretending that every clause is negotiable, but do suggest realistic asks.',
  ].join('\n'),
  buildTaskPrompt(): string {
    return [
      'AGENT: NegotiationAdvisorAgent',
      'Task: Suggest what the user should ask for, push back on, or clarify before signing.',
      'Output under "negotiationAdvisor" as:',
      '{ "advice": [{ "clauseId": "clause_1", "suggestedAction": "...", "negotiationTip": "..." }], "recommendedQuestions": ["...", "..."] }',
    ].join('\n');
  },
};
