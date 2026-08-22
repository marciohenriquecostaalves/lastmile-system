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
      <div class="sidebar-brand" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Last Mile <span style="color:var(--accent);">OS</span></span>
        <div style="position:relative;">
          <button id="btn-notificacoes" onclick="alternarPainelNotificacoes(event)" style="background:none; border:none; padding:4px; cursor:pointer; color:var(--ink-soft);">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8a5 5 0 0110 0c0 3 1 4 1 4H4s1-1 1-4zM8.5 15a1.5 1.5 0 003 0"/></svg>
          </button>
          <span id="badge-notificacoes" class="oculto" style="position:absolute; top:-2px; right:-2px; background:var(--danger); color:white; font-size:9px; font-weight:700; width:15px; height:15px; border-radius:50%; display:flex; align-items:center; justify-content:center;"></span>
        </div>
      </div>
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

    <div id="painel-notificacoes" class="oculto" style="position:fixed; top:16px; left:250px; width:320px; max-height:400px; overflow-y:auto; background:var(--surface); border:1px solid var(--border); border-radius:10px; box-shadow:0 8px 24px rgba(20,33,61,0.12); z-index:20; padding:12px;">
      <div style="font-family:var(--font-display); font-weight:600; font-size:13px; padding:4px 8px 10px; border-bottom:1px solid var(--border); margin-bottom:8px;">Notificacoes</div>
      <div id="lista-notificacoes"></div>
    </div>
  `;

  document.dispatchEvent(new CustomEvent('sessaoCarregada', { detail: dados }));
  atualizarContadorNotificacoes();
  setInterval(atualizarContadorNotificacoes, 20000);
}

async function atualizarContadorNotificacoes() {
  const resposta = await fetch('/api/notificacoes/nao-lidas');
  const dados = await resposta.json();
  const badge = document.getElementById('badge-notificacoes');
  if (dados.total > 0) {
    badge.textContent = dados.total > 9 ? '9+' : dados.total;
    badge.classList.remove('oculto');
  } else {
    badge.classList.add('oculto');
  }
}

async function alternarPainelNotificacoes(event) {
  event.stopPropagation();
  const painel = document.getElementById('painel-notificacoes');
  const estaAberto = !painel.classList.contains('oculto');

  if (estaAberto) {
    painel.classList.add('oculto');
    return;
  }

  const notificacoes = await (await fetch('/api/notificacoes')).json();
  document.getElementById('lista-notificacoes').innerHTML = notificacoes.map(n => `
    <div onclick="marcarNotificacaoLida('${n.id}', this)" style="padding:8px; border-radius:6px; cursor:pointer; font-size:12.5px; margin-bottom:2px; ${n.lida ? 'opacity:0.55;' : 'background:var(--accent-soft);'}">
      <div>${n.mensagem}</div>
      <div style="color:var(--ink-soft); font-size:11px; margin-top:2px;">${new Date(n.criadoEm).toLocaleString('pt-BR')}</div>
    </div>
  `).join('') || '<div class="page-subtitle" style="padding:8px;">Nenhuma notificacao ainda.</div>';

  painel.classList.remove('oculto');
}

async function marcarNotificacaoLida(id, elemento) {
  await fetch(`/api/notificacoes/${id}/lida`, { method: 'PATCH' });
  elemento.style.opacity = '0.55';
  elemento.style.background = 'transparent';
  atualizarContadorNotificacoes();
}

document.addEventListener('click', () => {
  const painel = document.getElementById('painel-notificacoes');
  if (painel) painel.classList.add('oculto');
});

async function sairDoSistema() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

montarNavegacao();
