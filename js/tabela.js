/*
 * Painel de Chamados — tabela.js
 * Tabela com busca, ordenação por coluna, paginação.
 * Atualização reativa sem recarregar a página.
 */

const COLUNAS = [
  { chave: 'id', rotulo: 'ID', ordenavel: true },
  { chave: 'filial', rotulo: 'Filial', ordenavel: true },
  { chave: 'categoria', rotulo: 'Categoria', ordenavel: true },
  { chave: 'prioridade', rotulo: 'Prioridade', ordenavel: true },
  { chave: 'aberto_em', rotulo: 'Aberto em', ordenavel: true, formatar: formatarDataHora },
  { chave: 'resolvido_em', rotulo: 'Resolvido em', ordenavel: true, formatar: formatarDataHora },
  { chave: 'prazo_horas', rotulo: 'Prazo (h)', ordenavel: true },
  { chave: 'status', rotulo: 'Status', ordenavel: true, formatar: formatarStatus }
];

const ITENS_POR_PAGINA = 25;

let estadoTabela = {
  dados: [],
  filtrados: [],
  paginaAtual: 1,
  ordenacao: { chave: null, direcao: 'asc' },
  busca: ''
};

const tbody = document.getElementById('tabelaCorpo');
const thead = document.getElementById('tabelaCabecalhoTabela');
const paginacao = document.getElementById('paginacao');
const buscaInput = document.getElementById('buscaTabela');

function formatarDataHora(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function formatarStatus(status) {
  const mapa = {
    aberto: '<span class="badge badge--aberto">Aberto</span>',
    resolvido: '<span class="badge badge--resolvido">Resolvido</span>'
  };
  return mapa[status] || status;
}

function criarBadge(classe, texto) {
  return `<span class="badge badge--${classe}">${texto}</span>`;
}

function escaparHtml(texto) {
  if (typeof texto !== 'string') return String(texto);
  return texto
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function aplicarBusca(dados, termo) {
  if (!termo.trim()) return dados;
  const t = termo.toLowerCase().trim();
  return dados.filter(c =>
    String(c.id).includes(t) ||
    c.filial.toLowerCase().includes(t) ||
    c.categoria.toLowerCase().includes(t) ||
    c.prioridade.toLowerCase().includes(t)
  );
}

function ordenarDados(dados, chave, direcao) {
  if (!chave) return dados;
  const mult = direcao === 'asc' ? 1 : -1;
  return [...dados].sort((a, b) => {
    let va = a[chave];
    let vb = b[chave];
    if (va === vb) return 0;
    if (va === null || va === undefined) return mult;
    if (vb === null || vb === undefined) return -mult;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    return va < vb ? -mult : mult;
  });
}

function renderizarCabecalho() {
  thead.innerHTML = COLUNAS.map(col => `
    <th scope="col" data-chave="${col.chave}" aria-sort="none" ${col.ordenavel ? 'tabindex="0"' : ''}>
      ${col.rotulo}
      ${col.ordenavel ? '<span class="ordenacao-indicador" aria-hidden="true"></span>' : ''}
    </th>
  `).join('');

  if (estadoTabela.ordenacao.chave) {
    const th = thead.querySelector(`[data-chave="${estadoTabela.ordenacao.chave}"]`);
    if (th) {
      th.setAttribute('aria-sort', estadoTabela.ordenacao.direcao === 'asc' ? 'ascending' : 'descending');
    }
  }

  thead.querySelectorAll('th[data-chave]').forEach(th => {
    if (th.hasAttribute('tabindex')) {
      th.addEventListener('click', () => aoCliqueOrdenacao(th.dataset.chave));
      th.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          aoCliqueOrdenacao(th.dataset.chave);
        }
      });
    }
  });
}

function aoCliqueOrdenacao(chave) {
  if (estadoTabela.ordenacao.chave === chave) {
    estadoTabela.ordenacao.direcao = estadoTabela.ordenacao.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    estadoTabela.ordenacao.chave = chave;
    estadoTabela.ordenacao.direcao = 'asc';
  }
  estadoTabela.paginaAtual = 1;
  renderizar();
}

function renderizarLinhas() {
  const inicio = (estadoTabela.paginaAtual - 1) * ITENS_POR_PAGINA;
  const fim = inicio + ITENS_POR_PAGINA;
  const pagina = estadoTabela.filtrados.slice(inicio, fim);

  if (pagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${COLUNAS.length}" class="tabela--vazio">Nenhum chamado encontrado</td></tr>`;
    return;
  }

  tbody.innerHTML = pagina.map(chamado => `
    <tr>
      ${COLUNAS.map(col => {
        let valor = chamado[col.chave];
        if (col.formatar) valor = col.formatar(valor);
        else valor = escaparHtml(valor);
        return `<td>${valor}</td>`;
      }).join('')}
    </tr>
  `).join('');
}

function renderizarPaginacao() {
  const totalPaginas = Math.ceil(estadoTabela.filtrados.length / ITENS_POR_PAGINA) || 1;
  const pagina = Math.min(estadoTabela.paginaAtual, totalPaginas);
  const inicio = (pagina - 1) * ITENS_POR_PAGINA + 1;
  const fim = Math.min(pagina * ITENS_POR_PAGINA, estadoTabela.filtrados.length);

  let html = `
    <span class="paginacao__info">
      Mostrando ${inicio}–${fim} de ${estadoTabela.filtrados.length}
    </span>
    <div class="paginacao__botoes">
  `;

  const maxVisiveis = 5;
  let inicioPag = Math.max(1, pagina - Math.floor(maxVisiveis / 2));
  const fimPag = Math.min(totalPaginas, inicioPag + maxVisiveis - 1);
  if (fimPag - inicioPag + 1 < maxVisiveis) {
    inicioPag = Math.max(1, fimPag - maxVisiveis + 1);
  }

  if (pagina > 1) {
    html += `<button type="button" data-pagina="${pagina - 1}" aria-label="Página anterior">‹</button>`;
  }

  for (let p = inicioPag; p <= fimPag; p++) {
    html += `<button type="button" data-pagina="${p}" ${p === pagina ? 'aria-current="page" disabled' : ''}>${p}</button>`;
  }

  if (pagina < totalPaginas) {
    html += `<button type="button" data-pagina="${pagina + 1}" aria-label="Próxima página">›</button>`;
  }

  html += '</div>';
  paginacao.innerHTML = html;

  paginacao.querySelectorAll('button[data-pagina]').forEach(btn => {
    btn.addEventListener('click', () => {
      estadoTabela.paginaAtual = parseInt(btn.dataset.pagina, 10);
      renderizar();
    });
  });
}

function renderizar() {
  let dados = estadoTabela.dados;
  dados = aplicarBusca(dados, estadoTabela.busca);
  dados = ordenarDados(dados, estadoTabela.ordenacao.chave, estadoTabela.ordenacao.direcao);
  estadoTabela.filtrados = dados;
  estadoTabela.paginaAtual = Math.min(estadoTabela.paginaAtual, Math.ceil(dados.length / ITENS_POR_PAGINA) || 1);

  renderizarCabecalho();
  renderizarLinhas();
  renderizarPaginacao();
}

export function inicializarTabela(dados) {
  estadoTabela.dados = dados;
  estadoTabela.filtrados = dados;
  estadoTabela.paginaAtual = 1;
  estadoTabela.ordenacao = { chave: null, direcao: 'asc' };
  estadoTabela.busca = '';
  if (buscaInput) buscaInput.value = '';
  renderizar();
}

export function atualizarTabela(dados) {
  estadoTabela.dados = dados;
  renderizar();
}

export function definirBusca(termo) {
  estadoTabela.busca = termo;
  estadoTabela.paginaAtual = 1;
  renderizar();
}

export function obterEstadoTabela() {
  return { ...estadoTabela };
}