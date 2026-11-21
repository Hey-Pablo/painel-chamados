# Painel de Chamados

> **Status: em desenvolvimento.** O código entra aos poucos; abaixo está o planejamento do projeto.

## O que é

Painel web com os indicadores de uma operação de suporte fictícia: 50 filiais, 60 dias e cerca de 1.500 chamados. Mostra volume, tempo médio de resolução, cumprimento de prazo (SLA) e pendências, com filtros.

## O que prova

JavaScript com dados (filtro, agregação, datas), visualização e entendimento dos indicadores de suporte.

## Stack

HTML, CSS, JavaScript e Chart.js. Script Node para gerar os dados. GitHub Pages.

## Estrutura

```
painel-chamados/
├─ index.html
├─ css/estilo.css
├─ js/
│  ├─ dados.js      # carrega e normaliza o JSON
│  ├─ filtros.js    # período, filial, categoria, prioridade
│  ├─ kpis.js       # funções puras de cálculo
│  ├─ graficos.js   # Chart.js
│  ├─ tabela.js     # lista com busca e ordenação
│  └─ main.js
├─ data/chamados.json
├─ tools/gerar-dados.js   # gerador com semente fixa
├─ tests/kpis.test.js
└─ README.md
```

## Plano

1. Defina o chamado: id, filial, categoria, prioridade, aberto_em, resolvido_em, prazo_horas, status.
2. Gerador de dados com semente fixa, picos às segundas e categorias com pesos diferentes.
3. Funções de indicador com teste: total, abertos, tempo médio de resolução, percentual dentro do prazo e pendências por idade.
4. Gráficos: chamados por dia (linha), por categoria (barras), 10 filiais com mais chamados e distribuição por prioridade.
5. Filtros que recalculam indicadores, gráficos e tabela ao mesmo tempo.
6. Tabela com busca, ordenação e paginação.
7. Layout responsivo e cores com contraste adequado.
8. Publicação e README explicando cada indicador e sua fórmula.

## Como deve funcionar

- A página abre em até 2 segundos com os indicadores do período completo.
- Trocar um filtro atualiza tudo sem recarregar.
- Os números dos cartões batem com a contagem da tabela filtrada.
- Funciona no celular.

## Prazo

3 a 4 dias.

## Autor

Pablo Dilio · [Portfólio](https://hey-pablo.github.io/pablo-dilio-portfolio/) · [LinkedIn](https://www.linkedin.com/in/pablo-dilio-4063991b2)

## Dados e lógica

Os dados são inteiramente fictícios. O gerador usa semente fixa e produz 1.500 chamados em 50 filiais e 60 dias, com mais chamados às segundas-feiras e categorias ponderadas. As datas estão em UTC.

Requer Node.js 20 ou superior. Para gerar os dados e executar os testes:

```sh
npm run gerar
npm test
```

O arquivo gerado é versionado e a execução repetida produz o mesmo conteúdo. Não há variáveis de ambiente necessárias; `.env.example` registra essa condição.

Os módulos ES em `js/` carregam e normalizam as datas, aplicam filtros combinados e calculam indicadores. Os filtros de período aceitam datas `AAAA-MM-DD` e incluem ambos os limites, pela data UTC de abertura.

O SLA divide os chamados resolvidos dentro do prazo pelo total de resolvidos mais os abertos vencidos, multiplicando por 100. Abertos ainda no prazo ficam fora do cálculo; resolução no limite cumpre o prazo. A idade das pendências usa dias completos desde a abertura. As funções que dependem do momento atual recebem `agora` explicitamente. Listas vazias produzem zero ou coleções vazias. As fórmulas completas estão no início de `js/kpis.js`.

A interface, os gráficos e a publicação ainda serão implementados.
