import { Injectable } from '@nestjs/common';
import { AgentDecision } from '../domain/agent-decision';

@Injectable()
export class RouterService {
  private readonly exprRegex = /^[\d\s\.\+\-\*\/x\(\)]+$/i;

  decideAgent(message: string): AgentDecision {
    const normalized = (message ?? '').trim();
    if (!normalized) return AgentDecision.knowledge();

    if (this.exprRegex.test(normalized)) return AgentDecision.math();

    return AgentDecision.knowledge();
  }
}
