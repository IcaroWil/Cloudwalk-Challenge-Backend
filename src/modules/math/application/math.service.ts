import { Injectable, BadRequestException } from '@nestjs/common';
import { Expression } from '../domain/expression';
import * as math from 'mathjs';

@Injectable()
export class MathService {
  evaluate(userMessage: string): { result: number; expression: string } {
    const expr = Expression.fromUserInput(userMessage).toString();
    try {
      const value = math.evaluate(expr);
      const result = typeof value === 'number' ? value : Number(value);
      if (!isFinite(result)) throw new Error('Invalid result');
      
      const rounded = Math.round(result * 1e6) / 1e6;
      return { result: rounded, expression: expr };
    } catch (e) {
      throw new BadRequestException('Expressão matemática inválida.');
    }
  }
}
