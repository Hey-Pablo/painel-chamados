/*
 * Painel de Chamados — main.js
 * Orquestra carregamento, filtros, KPIs, gráficos e tabela.
 * Atualização reativa sem recarregar a página.
 */

import { carregarDados } from './dados.js';
import { aplicarFiltros } from './filtros.js';
import { total, abertos, tempoMedioResolucaoHoras, percentualDentroDoPrazo, pendenciasPorIdade, chamadosPorDia, porCategoria, topFiliais, porPrioridade } from './kpis.js';
import { gerenciadorGraficos } from './graficos.js';
import { inicializarTabela, atualizarTabela, definirBusca, obterEstadoTabela } from './tabela.js';

const estado = {
  dados: [],
  filtros: { de: '', ate: '', filial: '', categoria: '', prioridade: '' },
  agora: new Date()
};

const elementos = {
  filtroDe: document.getElementById('filtroDe'),
  filtroAte: document.getElementById('filtroAte'),
  filtroFilial: document.getElementById('filtroFilial'),
  filtroCategoria: document.getElementById('filtroCategoria'),
  filtroPrioridade: document.getElementById('filtroPrioridade'),
  botaoLimpar: document.getElementById('boutaoLimpar'),
  kpis: document.getElementById('kpis'),
  indicadorEstado: document.getElementById('indicadorEstado'),
  buscaTabela: document.getElementById('buscaTabela')
};

function definirEstadoCarregando(mensagem = 'Carregando...') {
  if (elementos.indicadorEstado) {
    elementos.indicadorEstado.textContent = mensagem;
    elementos.indicadorEstado.className = 'estado estado--carregando';
  }
}

function definirEstadoErro(mensagem) {
  if (elementos.indicadorEstado) {
    elementos.indicadorEstado.textContent = mensagem;
    elementos.indicadorEstado.className = 'estado estado--erro';
  }
}

function definirEstadoPronto() {
  if (elementos.indicadorEstado) {
    elementos.indicadorEstado.textContent = 'Pronto';
    elementos.indicadorEstado.className = 'estado estado--pronto';
    setTimeout(() => {
      if (elementos.indicadorEstado.textContent === 'Pronto') {
        elementos.indicadorEstado.textContent = '';
        elementos.indicadorEstado.className = 'estado';
      }
    }, 3000);
  }
}

function popularSelects(dados) {
  const filiais = [...new Set(dados.map(c => c.filial))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  const categorias = [...new Set(dados.map(c => c.categoria))].sort();
  const prioridades = [...new Set(dados.map(c => c.prioridade))].sort((a, b) => {
    const ordem = { critica: 0, alta: 1, media: 2, baixa: 3 };
    return (ordem[a] ?? 99) - (ordem[b] ?? 99);
  });

  const criarOpcao = (valor, texto) => {
    const opt = document.createElement('option');
    opt.value = valor;
    opt.textContent = texto;
    return opt;
  };

  [elementos.filtroFilial, elementos.filtroCategoria, elementos.filtroPrioridade].forEach(sel => {
    if (sel) sel.innerHTML = '<option value="">Todas</option>';
  });

  filiais.forEach(f => {
    elementos.filtroFilial?.appendChild(criarOpcao(f, f));
  });
  categorias.forEach(c => {
    elementos.filtroCategoria?.appendChild(criarOpcao(c, c));
  });
  prioridades.forEach(p => {
    elementos.filtroPrioridade?.appendChild(criarOpcao(p, p.charAt(0).toUpperCase() + p.slice(1)));
  });
}

function definirDatasPadrao(dados) {
  if (!dados.length) return;
  const datas = dados.map(c => c.aberto_em.toISOString().slice(0, 10)).sort();
  if (elementos.filtroDe) elementos.filtroDe.value = datas[0];
  if (elementos.filtroAte) elementos.filtroAte.value = datas[datas.length - 1];
}

function obterFiltrosAtuais() {
  return {
    de: elementos.filtroDe?.value || '',
    ate: elementos.filtroAte?.value || '',
    filial: elementos.filtroFilial?.value || '',
    categoria: elementos.filtroCategoria?.value || '',
    prioridade: elementos.filtroPrioridade?.value || ''
  };
}

function aplicarFiltrosEAtualizar() {
  estado.filtros = obterFiltrosAtuais();
  const filtrados = aplicarFiltros(estado.dados, estado.filtros);
  atualizarKPIs(filtrados);
  atualizarGraficos(filtrados);
  atualizarTabela(filtrados);
}

function atualizarKPIs(filtrados) {
  const t = total(filtrados);
  const a = abertos(filtrados);
  const tmp = tempoMedioResolucaoHoras(filtrados);
  const sla = percentualDentroDoPrazo(filtrados, estado.agora);
  const pend = pendenciasPorIdade(filtrados, estado.agora);

  const kpiHTML = `
    <article class="kpi kpi--total">
      <span class="kpi__rotulo">Total de chamados</span>
      <span class="kpi__valor">${t}</span>
    </article>
    <article class="kpi kpi--abertos">
      <span class="kpi__rotulo">Abertos</span>
      <span class="kpi__valor">${a}</span>
    </article>
    <article class="kpi kpi--tempo">
      <span class="kpi__rotulo">Tempo médio de resolução (h)</span>
      <span class="kpi__valor">${tmp.toFixed(1)}</span>
    </article>
    <article class="kpi kpi--sla">
      <span class="kpi__rotulo">% Dentro do prazo (SLA)</span>
      <span class="kpi__valor">${sla.toFixed(1)}%</span>
    </article>
  `;

  if (elementos.kpis) {
    elementos.kpis.innerHTML = kpiHTML;
  }
}

function atualizarGraficos(filtrados) {
  const dadosGraficos = {
    chamadosPorDia: chamadosPorDia(filtrados),
    porCategoria: porCategoria(filtrados),
    topFiliais: Object.fromEntries(topFiliais(filtrados, 10).map(f => [f.filial, f.total])),
    porPrioridade: porPrioridade(filtrados),
    pendenciasPorIdade: pendenciasPorIdade(filtrados, estado.agora)
  };

  gerenciadorGraficos.atualizar(dadosGraficos);
}

function limparFiltros() {
  if (elementos.filtroDe) elementos.filtroDe.value = '';
  if (elementos.filtroAte) elementos.filtroAte.value = '';
  if (elementos.filtroFilial) elementos.filtroFilial.value = '';
  if (elementos.filtroCategoria) elementos.filtroCategoria.value = '';
  if (elementos.filtroPrioridade) elementos.filtroPrioridade.value = '';
  if (elementos.buscaTabela) elementos.buscaTabela.value = '';
  definirBusca('');
  aplicarFiltrosEAtualizar();
}

function configurarEventos() {
  [elementos.filtroDe, elementos.filtroAte, elementos.filtroFilial, elementos.filtroCategoria, elementos.filtroPrioridade].forEach(el => {
    if (el) {
      el.addEventListener('change', aplicarFiltrosEAtualizar);
    }
  });

  if (elementos.botaoLimpar) {
    elementos.botaoLimpar.addEventListener('click', limparFiltros);
  }

  if (elementos.buscaTabela) {
    let timeoutBusca;
    elementos.buscaTabela.addEventListener('input', () => {
      clearTimeout(timeoutBusca);
      timeoutBusca = setTimeout(() => {
        definirBusca(elementos.buscaTabela.value);
      }, 150);
    });
  }
}

async function inicializar() {
  definirEstadoCarregando('Carregando dados...');

  try {
    const dados = await carregarDados();
    estado.dados = dados;

    popularSelects(dados);
    definirDatasPadrao(dados);

    configurarEventos();

    gerenciadorGraficos.inicializar();

    aplicarFiltrosEAtualizar();

    inicializarTabela(dados);

    definirEstadoPronto();
  } catch (erro) {
    console.error('Erro ao inicializar:', erro);
    definirEstadoErro(`Erro: ${erro.message}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}