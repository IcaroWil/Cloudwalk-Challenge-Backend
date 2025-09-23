import { RouterService } from '../../src/modules/router/application/router.service';

describe('RouterService', () => {
  const service = new RouterService();

  it('rota para MathAgent quando for expressão simples', () => {
    expect(service.decideAgent('70 + 12').agent).toBe('MathAgent');
    expect(service.decideAgent('65 x 3.11').agent).toBe('MathAgent');
    expect(service.decideAgent('(42 * 2) / 6').agent).toBe('MathAgent');
  });

  it('rota para KnowledgeAgent quando for texto', () => {
    expect(service.decideAgent('qual a taxa do parcelamento?').agent).toBe('KnowledgeAgent');
  });

  it('texto vazio cai em KnowledgeAgent', () => {
    expect(service.decideAgent('').agent).toBe('KnowledgeAgent');
  });
});
