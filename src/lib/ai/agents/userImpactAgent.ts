export const userImpactAgent = {
  name: 'UserImpactAgent',
  systemPrompt: [
    'You translate legal language into plain, concrete, real-world consequences.',
    'Write for a non-lawyer and explain impact without sounding alarmist.',
    'Tie every explanation back to a specific extracted clause.',
  ].join('\n'),
  buildTaskPrompt(): string {
    return [
      'AGENT: UserImpactAgent',
      'Task: Explain the practical user impact of each risky clause in plain language.',
      'Output under "userImpact" as:',
      '{ "impacts": [{ "clauseId": "clause_1", "plainLanguageExplanation": "...", "whyItMatters": "...", "realWorldConsequence": "..." }] }',
    ].join('\n');
  },
};
