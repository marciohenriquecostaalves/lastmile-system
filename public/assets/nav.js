const ITENS_MENU = [
  { path: '/', label: 'Inicio', icone: 'M3 10l7-6 7 6v8a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1v-8z', papeis: null },
  { path: '/pedidos', label: 'Pedidos', icone: 'M4 4h12v4H4V4zm0 6h12v6H4v-6z', papeis: null },
  { path: '/motoristas', label: 'Motoristas', icone: 'M3 12l1-5h9l3 3v2h1a1 1 0 011 1v2h-2a2 2 0 11-4 0H8a2 2 0 11-4 0H3v-3z', papeis: null },
  { path: '/rotas', label: 'Rotas', icone: 'M4 16c3-8 5-8 6-12 1 4 3 4 6 12M6 16h8', papeis: null },
  { path: '/usuarios', label: 'Usuarios', icone: 'M7 8a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM3 16c0-3 2-5 4-5s4 2 4 5M11 16c0-2 1-4 3-4.5', papeis: ['gerente', 'supervisor'] },
  { path: '/filiais', label: 'Filiais', icone: 'M4 16V6l6-3 6 3v10M8 16v-4h4v4', papeis: ['gerente'] },
];

async function montarNavegacao() {
  const resposta = await fetch('/auth/status');
  const dados = await resposta.json();

  if (!dados.autenticado) {
    window.location.href = '/login.html';
    return;
  }

  window.sessaoAtual = dados;
  window.podeOperar = ['gerente', 'supervisor', 'coordenador', 'dispatcher'].includes(dados.papel) && !!dados.filialId;

  const caminhoAtual = window.location.pathname;
  const itensVisiveis = ITENS_MENU.filter(
    (item) => !item.papeis || item.papeis.includes(dados.papel)
  );

  const mount = document.getElementById('sidebar-mount');
  mount.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-brand">Last Mile <span>OS</span></div>
      <nav class="sidebar-nav">
        ${itensVisiveis.map(item => `
          <a href="${item.path}" class="nav-item ${caminhoAtual === item.path ? 'active' : ''}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${item.icone}"/></svg>
            ${item.label}
          </a>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <strong>${dados.papel.replace('_', ' ')}</strong>
          ${dados.filialId ? '' : '<span class="papel-tag">Visao global</span>'}
        </div>
        <button class="btn-secondary" style="width:100%" onclick="sairDoSistema()">Sair</button>
      </div>
    </div>
  `;

  document.dispatchEvent(new CustomEvent('sessaoCarregada', { detail: dados }));
}

async function sairDoSistema() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

montarNavegacao();
