// O período considera a data UTC de abertura e inclui os dois limites.
export function aplicarFiltros(chamados, { de, ate, filial, categoria, prioridade } = {}) {
  return chamados.filter(c => {
    const dia = new Date(c.aberto_em).toISOString().slice(0, 10);
    return (!de || dia >= de) && (!ate || dia <= ate) &&
      (!filial || c.filial === filial) && (!categoria || c.categoria === categoria) &&
      (!prioridade || c.prioridade === prioridade);
  });
}
