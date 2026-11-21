export async function carregarDados(url = './data/chamados.json') {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao carregar chamados: HTTP ${resposta.status}`);
  const chamados = await resposta.json();
  return chamados.map(c => ({ ...c, aberto_em: new Date(c.aberto_em), resolvido_em: c.resolvido_em ? new Date(c.resolvido_em) : null }));
}
