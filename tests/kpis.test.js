import { test } from 'node:test';
import assert from 'node:assert/strict';
import { total, abertos, tempoMedioResolucaoHoras, percentualDentroDoPrazo, pendenciasPorIdade, chamadosPorDia, porCategoria, topFiliais, porPrioridade } from '../js/kpis.js';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const chamados = [
  { filial: 'Filial 01', categoria: 'ERP', prioridade: 'alta', aberto_em: '2024-01-01T00:00:00Z', resolvido_em: '2024-01-01T02:00:00Z', prazo_horas: 2, status: 'resolvido' },
  { filial: 'Filial 02', categoria: 'Rede', prioridade: 'baixa', aberto_em: '2024-01-02T00:00:00Z', resolvido_em: '2024-01-02T04:00:00Z', prazo_horas: 3, status: 'resolvido' },
  { filial: 'Filial 01', categoria: 'ERP', prioridade: 'alta', aberto_em: '2024-01-03T00:00:00Z', resolvido_em: null, prazo_horas: 24, status: 'aberto' },
  { filial: 'Filial 02', categoria: 'Rede', prioridade: 'baixa', aberto_em: '2024-01-10T00:00:00Z', resolvido_em: null, prazo_horas: 48, status: 'aberto' },
];
const agora = new Date('2024-01-10T12:00:00Z');
test('indicadores calculam SLA inclusive no limite e contam aberto vencido', () => {
  assert.equal(total(chamados), 4); assert.equal(abertos(chamados), 2);
  assert.equal(tempoMedioResolucaoHoras(chamados), 3);
  assert.ok(Math.abs(percentualDentroDoPrazo(chamados, agora) - 100 / 3) < 1e-10);
  assert.deepEqual(pendenciasPorIdade(chamados, agora), { '0-1d': 1, '2-3d': 0, '4-7d': 1, '>7d': 0 });
});
test('agrupamentos e desempate de filiais são determinísticos', () => {
  assert.deepEqual(chamadosPorDia(chamados), { '2024-01-01': 1, '2024-01-02': 1, '2024-01-03': 1, '2024-01-10': 1 });
  assert.deepEqual(porCategoria(chamados), { ERP: 2, Rede: 2 });
  assert.deepEqual(porPrioridade(chamados), { alta: 2, baixa: 2 });
  assert.deepEqual(topFiliais(chamados, 1), [{ filial: 'Filial 01', total: 2 }]);
});
test('listas vazias retornam valores finitos e coleções vazias', () => {
  assert.equal(total([]), 0); assert.equal(abertos([]), 0); assert.equal(tempoMedioResolucaoHoras([]), 0); assert.equal(percentualDentroDoPrazo([], agora), 0);
  assert.deepEqual(pendenciasPorIdade([], agora), { '0-1d': 0, '2-3d': 0, '4-7d': 0, '>7d': 0 });
  assert.deepEqual(chamadosPorDia([]), {}); assert.deepEqual(porCategoria([]), {}); assert.deepEqual(porPrioridade([]), {}); assert.deepEqual(topFiliais([], 10), []);
});
test('gerador é determinístico e produz população fictícia consistente', () => {
  execFileSync('node', ['tools/gerar-dados.js']); const primeiro = readFileSync('data/chamados.json', 'utf8');
  execFileSync('node', ['tools/gerar-dados.js']); assert.equal(readFileSync('data/chamados.json', 'utf8'), primeiro);
  const dados = JSON.parse(primeiro); assert.equal(dados.length, 1500); assert.equal(new Set(dados.map(c => c.filial)).size, 50);
  assert.equal(new Set(dados.map(c => c.aberto_em.slice(0, 10))).size, 60);
  assert.ok(dados.filter(c => c.status === 'aberto').length / dados.length > 0.06 && dados.filter(c => c.status === 'aberto').length / dados.length < 0.10);
});
