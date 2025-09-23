export type Agent = 'MathAgent' | 'KnowledgeAgent';

export class AgentDecision {
  private constructor(public readonly agent: Agent) {}
  static math() { return new AgentDecision('MathAgent'); }
  static knowledge() { return new AgentDecision('KnowledgeAgent'); }
}
