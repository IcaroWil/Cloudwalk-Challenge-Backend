import { MathService } from '../../src/modules/math/application/math.service';

describe('MathService', () => {
  const service = new MathService();

  it('calcula multiplicação com x', () => {
    const out = service.evaluate('65 x 3.11');
    expect(out.expression).toBe('65 * 3.11');
    expect(out.result).toBeCloseTo(202.15, 2);
  });

  it('calcula expressão com parênteses', () => {
    const out = service.evaluate('(42 * 2) / 6');
    expect(out.result).toBeCloseTo(14);
  });

  it('lança erro para expressão inválida', () => {
    expect(() => service.evaluate('2 + (3 *')).toThrow();
  });
});
