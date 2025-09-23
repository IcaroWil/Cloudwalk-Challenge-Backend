export class Expression {
    private constructor(public readonly raw: string) {}
  
    static fromUserInput(input: string): Expression {
      const cleaned = (input ?? '')
        .toLowerCase()
        .replace(/,/g, '.')
        .replace(/×/g, 'x')
        .replace(/x/gi, '*') 
        .trim();
  
      return new Expression(cleaned);
    }
  
    toString() { return this.raw; }
  }
  