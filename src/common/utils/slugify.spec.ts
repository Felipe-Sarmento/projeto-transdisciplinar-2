import { slugify } from './slugify';

describe('slugify', () => {
  it('normaliza nome em minúsculas com hífens', () => {
    expect(slugify('Veganos Gourmet')).toBe('veganos-gourmet');
  });

  it('remove acentos', () => {
    expect(slugify('Chocolate Belga Clássico')).toBe(
      'chocolate-belga-classico',
    );
  });

  it('remove espaços das bordas e símbolos', () => {
    expect(slugify('  Red Velvet!  ')).toBe('red-velvet');
  });
});
