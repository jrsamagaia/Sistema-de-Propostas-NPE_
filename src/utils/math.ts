/**
 * Funções de utilidade matemática e formatação monetária da Editora NPE.
 * REGRA DO SISTEMA: Sempre trabalhar com 2 casas decimais e arredondamento SEMPRE para cima (Teto / Ceil).
 */

/**
 * Arredonda qualquer valor numérico sempre para cima (ceil) com 2 casas decimais.
 * Trata ruídos infinitesimais de ponto flutuante do Javascript para garantir precisão exata.
 * 
 * Exemplos:
 * ceil2(10.50)  => 10.50
 * ceil2(10.501) => 10.51
 * ceil2(10.509) => 10.51
 * ceil2(10.500000000000002) => 10.50
 */
export function ceil2(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return 0;
  
  const factor = 100;
  // Trata ruído em 8 casas decimais antes de escalar para 2 casas
  const scaled = Math.round((num + Number.EPSILON) * 100000000) / 1000000;
  return Math.ceil(scaled) / factor;
}

/**
 * Formata um valor numérico em moeda brasileira (BRL), aplicando arredondamento para cima em 2 casas decimais.
 * Exemplo: 1234.561 => "R$ 1.234,57"
 */
export function formatCurrency(val: number | string | undefined | null): string {
  const rounded = ceil2(val);
  return rounded.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata um valor numérico como "R$ 1.234,56", aplicando arredondamento para cima em 2 casas decimais.
 */
export function formatMoney(val: number | string | undefined | null): string {
  const rounded = ceil2(val);
  return `R$ ${rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formata apenas o número com 2 casas decimais no padrão brasileiro (ex: "1.234,56").
 */
export function formatNumber2(val: number | string | undefined | null): string {
  const rounded = ceil2(val);
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Retorna uma string com 2 casas decimais com ponto (ex: "1234.56") arredondado para cima.
 */
export function formatFixed2(val: number | string | undefined | null): string {
  const rounded = ceil2(val);
  return rounded.toFixed(2);
}
