/*
 * Painel de Chamados — graficos.js
 * Chart.js 4 via CDN (versão fixa 4.4.3). Gráficos: linha, barras, pizza.
 * Usa Chart.update() para transições suaves sem recriar instâncias.
 */

const CORES = {
  primaria: '#2563eb',
  primariaFraca: 'rgba(37, 99, 235, 0.15)',
  sucesso: '#059669',
  sucessoFraca: 'rgba(5, 150, 105, 0.15)',
  aviso: '#d97706',
  avisoFraca: 'rgba(217, 119, 6, 0.15)',
  perigo: '#dc2626',
  perigoFraca: 'rgba(220, 38, 38, 0.15)',
  categorias: [
    '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#ea580c',
    '#0891b2', '#65a30d', '#be123c', '#4338ca'
  ],
  prioridades: {
    critica: '#dc2626',
    alta: '#ea580c',
    media: '#d97706',
    baixa: '#059669'
  },
  grade: 'rgba(0, 0, 0, 0.06)',
  gradeEscuro: 'rgba(255, 255, 255, 0.1)',
  texto: '#1e293b',
  textoSecundario: '#64748b',
  fundo: '#ffffff',
  fundoEscuro: '#1e293b'
};

const ehEscuro = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const obterCoresTema = () => {
  const escuro = ehEscuro();
  return {
    grade: escuro ? CORES.gradeEscuro : CORES.grade,
    texto: escuro ? '#f1f5f9' : CORES.texto,
    textoSecundario: escuro ? '#94a3b8' : CORES.textoSecundario,
    fundo: escuro ? CORES.fundoEscuro : CORES.fundo
  };
};

const criarGradiente = (ctx, cor) => {
  const gradiente = ctx.createLinearGradient(0, 0, 0, 280);
  gradiente.addColorStop(0, cor.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('#', '').replace('rgba(', ''));
  gradiente.addColorStop(1, 'transparent');
  return gradiente;
};

const formatarNumero = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

const formatarDataCurta = (iso) => {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
};

class GerenciadorGraficos {
  constructor() {
    this.graficos = {};
    this.temaAtual = obterCoresTema();
    this.inicializarObservadorTema();
  }

  inicializarObservadorTema() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.temaAtual = obterCoresTema();
      this.atualizarTemaTodos();
    });
  }

  atualizarTemaTodos() {
    Object.values(this.graficos).forEach(grafico => {
      if (grafico && typeof grafico.update === 'function') {
        this.aplicarTema(grafico);
        grafico.update('none');
      }
    });
  }

  aplicarTema(grafico) {
    const tema = this.temaAtual;
    grafico.options.scales?.x?.grid?.color && (grafico.options.scales.x.grid.color = tema.grade);
    grafico.options.scales?.y?.grid?.color && (grafico.options.scales.y.grid.color = tema.grade);
    grafico.options.scales?.x?.ticks?.color && (grafico.options.scales.x.ticks.color = tema.textoSecundario);
    grafico.options.scales?.y?.ticks?.color && (grafico.options.scales.y.ticks.color = tema.textoSecundario);
    grafico.options.plugins?.legend?.labels?.color && (grafico.options.plugins.legend.labels.color = tema.texto);
    grafico.options.plugins?.title?.color && (grafico.options.plugins.title.color = tema.texto);
    if (grafico.options.scales?.r) {
      grafico.options.scales.r.grid.color = tema.grade;
      grafico.options.scales.r.angleLines.color = tema.grade;
      grafico.options.scales.r.ticks.color = tema.textoSecundario;
    }
  }

  criarGraficoLinha(ctx, dados, rotulo) {
    const tema = this.temaAtual;
    const gradiente = ctx.createLinearGradient(0, 0, 0, 280);
    gradiente.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
    gradiente.addColorStop(1, 'transparent');

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(dados),
        datasets: [{
          label: rotulo,
          data: Object.values(dados),
          borderColor: CORES.primaria,
          backgroundColor: gradiente,
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: CORES.primaria,
          pointBorderColor: tema.fundo,
          pointBorderWidth: 2
        }]
      },
      options: this.opcoesBase({
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 12, autoSkip: true, maxRotation: 0 }
          },
          y: {
            beginAtZero: true,
            grid: { color: tema.grade },
            ticks: { color: tema.textoSecundario, stepSize: 1, callback: v => Number.isInteger(v) ? v : '' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tema.fundo,
            titleColor: tema.texto,
            bodyColor: tema.texto,
            borderColor: tema.grade,
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: ctx => `${ctx.parsed.y} chamados`
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      })
    });
  }

  criarGraficoBarras(ctx, dados, rotulo, cores) {
    const tema = this.temaAtual;
    const chaves = Object.keys(dados);
    const valores = Object.values(dados);
    const coresBarras = cores || chaves.map((_, i) => CORES.categorias[i % CORES.categorias.length]);

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chaves,
        datasets: [{
          label: rotulo,
          data: valores,
          backgroundColor: coresBarras,
          borderColor: coresBarras.map(c => c.replace('0.8', '1')),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: this.opcoesBase({
        indexAxis: chaves.length > 8 ? 'y' : 'x',
        scales: {
          x: chaves.length > 8 ? {
            beginAtZero: true,
            grid: { color: tema.grade },
            ticks: { color: tema.textoSecundario }
          } : {
            grid: { display: false },
            ticks: { color: tema.textoSecundario }
          },
          y: chaves.length > 8 ? {
            grid: { display: false },
            ticks: { color: tema.textoSecundario }
          } : {
            beginAtZero: true,
            grid: { color: tema.grade },
            ticks: { color: tema.textoSecundario, stepSize: 1, callback: v => Number.isInteger(v) ? v : '' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tema.fundo,
            titleColor: tema.texto,
            bodyColor: tema.texto,
            borderColor: tema.grade,
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: ctx => `${ctx.parsed.x || ctx.parsed.y} chamados`
            }
          }
        }
      })
    });
  }

  criarGraficoPizza(ctx, dados, rotulo) {
    const tema = this.temaAtual;
    const chaves = Object.keys(dados);
    const valores = Object.values(dados);
    const cores = chaves.map((_, i) => CORES.categorias[i % CORES.categorias.length]);

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chaves,
        datasets: [{
          label: rotulo,
          data: valores,
          backgroundColor: cores,
          borderColor: tema.fundo,
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        ...this.opcoesBase({}),
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: tema.texto,
              font: { size: 12 },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: tema.fundo,
            titleColor: tema.texto,
            bodyColor: tema.texto,
            borderColor: tema.grade,
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  criarGraficoBarrasHorizontal(ctx, dados, rotulo) {
    const tema = this.temaAtual;
    const chaves = Object.keys(dados);
    const valores = Object.values(dados);
    const cores = chaves.map((_, i) => CORES.categorias[i % CORES.categorias.length]);

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chaves,
        datasets: [{
          label: rotulo,
          data: valores,
          backgroundColor: cores,
          borderColor: cores.map(c => c.replace('0.8', '1')),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: this.opcoesBase({
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: tema.grade },
            ticks: { color: tema.textoSecundario }
          },
          y: {
            grid: { display: false },
            ticks: { color: tema.textoSecundario }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tema.fundo,
            titleColor: tema.texto,
            bodyColor: tema.texto,
            borderColor: tema.grade,
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: ctx => `${ctx.parsed.x} chamados`
            }
          }
        }
      })
    });
  }

  opcoesBase(extra = {}) {
    const tema = this.temaAtual;
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: { top: 8, right: 8, bottom: 8, left: 8 }
      },
      plugins: {
        legend: {
          labels: {
            color: tema.texto,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: tema.fundo,
          titleColor: tema.texto,
          bodyColor: tema.texto,
          borderColor: tema.grade,
          borderWidth: 1,
          padding: 10,
          displayColors: true
        }
      },
      scales: {
        x: {
          grid: { color: tema.grade },
          ticks: { color: tema.textoSecundario, font: { size: 11 } }
        },
        y: {
          grid: { color: tema.grade },
          ticks: { color: tema.textoSecundario, font: { size: 11 } }
        }
      },
      ...extra
    };
  }

  inicializar() {
    const ids = [
      'graficoDia', 'graficoCategoria', 'graficoFiliais',
      'graficoPrioridade', 'graficoPendencias'
    ];

    ids.forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        this.graficos[id] = { ctx, chart: null, tipo: id };
      }
    });
  }

  atualizar(dadosFiltrados, kpis) {
    if (!this.graficos.graficoDia?.ctx) this.inicializar();

    const { chamadosPorDia, porCategoria, topFiliais, porPrioridade, pendenciasPorIdade } = dadosFiltrados;

    if (this.graficos.graficoDia?.chart) {
      this.graficos.graficoDia.chart.data.labels = Object.keys(chamadosPorDia);
      this.graficos.graficoDia.chart.data.datasets[0].data = Object.values(chamadosPorDia);
      this.graficos.graficoDia.chart.update();
    } else if (this.graficos.graficoDia?.ctx) {
      this.graficos.graficoDia.chart = this.criarGraficoLinha(
        this.graficos.graficoDia.ctx, chamadosPorDia, 'Chamados por dia'
      );
    }

    if (this.graficos.graficoCategoria?.chart) {
      this.graficos.graficoCategoria.chart.data.labels = Object.keys(porCategoria);
      this.graficos.graficoCategoria.chart.data.datasets[0].data = Object.values(porCategoria);
      this.graficos.graficoCategoria.chart.data.datasets[0].backgroundColor =
        Object.keys(porCategoria).map((_, i) => CORES.categorias[i % CORES.categorias.length]);
      this.graficos.graficoCategoria.chart.update();
    } else if (this.graficos.graficoCategoria?.ctx) {
      this.graficos.graficoCategoria.chart = this.criarGraficoBarras(
        this.graficos.graficoCategoria.ctx, porCategoria, 'Por categoria'
      );
    }

    if (this.graficos.graficoFiliais?.chart) {
      this.graficos.graficoFiliais.chart.data.labels = Object.keys(topFiliais);
      this.graficos.graficoFiliais.chart.data.datasets[0].data = Object.values(topFiliais);
      this.graficos.graficoFiliais.chart.data.datasets[0].backgroundColor =
        Object.keys(topFiliais).map((_, i) => CORES.categorias[i % CORES.categorias.length]);
      this.graficos.graficoFiliais.chart.update();
    } else if (this.graficos.graficoFiliais?.ctx) {
      this.graficos.graficoFiliais.chart = this.criarGraficoBarrasHorizontal(
        this.graficos.graficoFiliais.ctx, topFiliais, 'Top 10 filiais'
      );
    }

    if (this.graficos.graficoPrioridade?.chart) {
      this.graficos.graficoPrioridade.chart.data.labels = Object.keys(porPrioridade);
      this.graficos.graficoPrioridade.chart.data.datasets[0].data = Object.values(porPrioridade);
      this.graficos.graficoPrioridade.chart.data.datasets[0].backgroundColor =
        Object.keys(porPrioridade).map(k => CORES.prioridades[k] || CORES.categorias[0]);
      this.graficos.graficoPrioridade.chart.update();
    } else if (this.graficos.graficoPrioridade?.ctx) {
      this.graficos.graficoPrioridade.chart = this.criarGraficoPizza(
        this.graficos.graficoPrioridade.ctx, porPrioridade, 'Distribuição por prioridade'
      );
    }

    if (this.graficos.graficoPendencias?.chart) {
      this.graficos.graficoPendencias.chart.data.labels = Object.keys(pendenciasPorIdade);
      this.graficos.graficoPendencias.chart.data.datasets[0].data = Object.values(pendenciasPorIdade);
      this.graficos.graficoPendencias.chart.data.datasets[0].backgroundColor = [
        CORES.sucesso, CORES.aviso, CORES.perigo, CORES.primaria
      ];
      this.graficos.graficoPendencias.chart.update();
    } else if (this.graficos.graficoPendencias?.ctx) {
      this.graficos.graficoPendencias.chart = this.criarGraficoBarras(
        this.graficos.graficoPendencias.ctx, pendenciasPorIdade, 'Pendências por idade',
        [CORES.sucesso, CORES.aviso, CORES.perigo, CORES.primaria]
      );
    }
  }

  destruir() {
    Object.values(this.graficos).forEach(g => {
      if (g.chart) {
        g.chart.destroy();
        g.chart = null;
      }
    });
  }
}

export const gerenciadorGraficos = new GerenciadorGraficos();