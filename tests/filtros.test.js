import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarFiltros } from '../js/filtros.js';
import { carregarDados } from '../js/dados.js';
const dados = [
  { aberto_em: new Date('2024-01-01T23:59:59Z'), filial: 'Filial 01', categoria: 'ERP', prioridade: 'alta' },
  { aberto_em: new Date('2024-01-02T12:00:00Z'), filial: 'Filial 02', categoria: 'Rede', prioridade: 'baixa' },
  { aberto_em: new Date('2024-01-03T00:00:00Z'), filial: 'Filial 01', categoria: 'ERP', prioridade: 'alta' },
];
test('filtros combinam critérios e incluem datas limite', () => {
  assert.deepEqual(aplicarFiltros(dados, { de: '2024-01-01', ate: '2024-01-02', filial: 'Filial 01', categoria: 'ERP', prioridade: 'alta' }), [dados[0]]);
  assert.deepEqual(aplicarFiltros(dados, { de: '2024-01-02', ate: '2024-01-02' }), [dados[1]]);
});
test('campos vazios não filtram e lista vazia permanece vazia', () => {
  assert.deepEqual(aplicarFiltros(dados, {}), dados); assert.deepEqual(aplicarFiltros([], { filial: 'x' }), []);
});
test('carregamento normaliza datas e rejeita HTTP malsucedido', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => [{ aberto_em: '2024-01-01T00:00:00Z', resolvido_em: null }] });
    const [item] = await carregarDados(); assert.ok(item.aberto_em instanceof Date); assert.equal(item.resolvido_em, null);
    globalThis.fetch = async () => ({ ok: false, status: 404 });
    await assert.rejects(carregarDados(), /404/);
  } finally { globalThis.fetch = original; }
});
