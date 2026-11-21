import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

function mulberry32(semente) {
  return () => {
    let t = semente += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const aleatorio = mulberry32(20241120);
const inteiro = max => Math.floor(aleatorio() * max);
const categorias = [['Impressora', 28], ['Rede', 23], ['ERP', 20], ['NF-e', 12], ['Acesso', 10], ['Hardware', 7]];
const prioridades = [['baixa', 72], ['média', 48], ['alta', 24], ['crítica', 4]];
const inicio = Date.UTC(2024, 0, 1);
const diaMs = 86400000;
const dias = Array.from({ length: 60 }, (_, dia) => ({ dia, peso: new Date(inicio + dia * diaMs).getUTCDay() === 1 ? 2 : 1 }));
function ponderado(opcoes) {
  let sorteio = aleatorio() * opcoes.reduce((s, [, peso]) => s + peso, 0);
  for (const [valor, peso] of opcoes) { sorteio -= peso; if (sorteio < 0) return valor; }
  return opcoes.at(-1)[0];
}
// Garante representação das 50 filiais e dos 60 dias, além da distribuição ponderada.
const chamados = Array.from({ length: 1500 }, (_, i) => {
  const dia = i < 60 ? i : ponderado(dias.map(d => [d.dia, d.peso]));
  const aberto = inicio + dia * diaMs + inteiro(diaMs);
  const [prioridade, prazo] = prioridades[ponderado([[0, 35], [1, 35], [2, 23], [3, 7]])];
  const abertoAinda = aleatorio() < 0.08;
  const duracao = (0.1 + aleatorio() * 1.5) * prazo * 3600000;
  return { id: i + 1, filial: `Filial ${String(i < 50 ? i + 1 : inteiro(50) + 1).padStart(2, '0')}`, categoria: ponderado(categorias), prioridade, aberto_em: new Date(aberto).toISOString(), resolvido_em: abertoAinda ? null : new Date(aberto + duracao).toISOString(), prazo_horas: prazo, status: abertoAinda ? 'aberto' : 'resolvido' };
});
const destino = fileURLToPath(new URL('../data/chamados.json', import.meta.url));
await mkdir(fileURLToPath(new URL('../data/', import.meta.url)), { recursive: true });
await writeFile(destino, `${JSON.stringify(chamados, null, 2)}\n`);
