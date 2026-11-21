/*
 * Total: quantidade de chamados. Abertos: quantidade com status aberto.
 * Tempo médio: soma das horas entre abertura e resolução / resolvidos.
 * SLA: resolvidos no prazo / (todos os resolvidos + abertos vencidos) × 100.
 * Abertos ainda no prazo ficam fora do SLA; prazo exato conta dentro do prazo.
 * Pendências: abertos por dias completos desde a abertura: 0–1, 2–3, 4–7 e >7.
 * Por dia, categoria e prioridade: contagem por data de abertura ou atributo.
 * Top filiais: contagem por filial, ordem decrescente e nome como desempate.
 * Divisões sem denominador retornam zero. Datas são interpretadas em UTC.
 */
const HORA = 3600000;
const data = valor => new Date(valor);
const resolvidos = chamados => chamados.filter(c => c.status === 'resolvido');
const agrupar = (chamados, chave) => chamados.reduce((resultado, chamado) => {
  const valor = chave(chamado);
  resultado[valor] = (resultado[valor] || 0) + 1;
  return resultado;
}, {});
export const total = chamados => chamados.length;
export const abertos = chamados => chamados.filter(c => c.status === 'aberto').length;
export function tempoMedioResolucaoHoras(chamados) {
  const itens = resolvidos(chamados);
  return itens.length ? itens.reduce((s, c) => s + (data(c.resolvido_em) - data(c.aberto_em)) / HORA, 0) / itens.length : 0;
}
export function percentualDentroDoPrazo(chamados, agora) {
  const itens = resolvidos(chamados);
  const dentro = itens.filter(c => data(c.resolvido_em) - data(c.aberto_em) <= c.prazo_horas * HORA).length;
  const vencidos = chamados.filter(c => c.status === 'aberto' && data(agora) - data(c.aberto_em) > c.prazo_horas * HORA).length;
  return itens.length + vencidos ? dentro / (itens.length + vencidos) * 100 : 0;
}
export function pendenciasPorIdade(chamados, agora) {
  const faixas = { '0-1d': 0, '2-3d': 0, '4-7d': 0, '>7d': 0 };
  for (const chamado of chamados.filter(c => c.status === 'aberto')) {
    const dias = Math.max(0, Math.floor((data(agora) - data(chamado.aberto_em)) / (24 * HORA)));
    faixas[dias < 2 ? '0-1d' : dias < 4 ? '2-3d' : dias < 8 ? '4-7d' : '>7d']++;
  }
  return faixas;
}
export const chamadosPorDia = chamados => Object.fromEntries(Object.entries(agrupar(chamados, c => data(c.aberto_em).toISOString().slice(0, 10))).sort(([a], [b]) => a.localeCompare(b)));
export const porCategoria = chamados => agrupar(chamados, c => c.categoria);
export const porPrioridade = chamados => agrupar(chamados, c => c.prioridade);
export const topFiliais = (chamados, n) => Object.entries(agrupar(chamados, c => c.filial)).map(([filial, total]) => ({ filial, total })).sort((a, b) => b.total - a.total || a.filial.localeCompare(b.filial)).slice(0, Math.max(0, n));
