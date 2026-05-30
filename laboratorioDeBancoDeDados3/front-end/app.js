/**
 * ☕ Café Manager — app.js
 * Consome a API REST Spring Boot /coffees
 */

const App = (() => {

  /* ── Estado ────────────────────────────────────── */
  let baseUrl    = 'http://localhost:8080';
  let allCoffees = [];
  let deleteTarget = null;

  /* ── Init ───────────────────────────────────────── */
  function init() {
    loadCoffees();
  }

  /* ── URL base ───────────────────────────────────── */
  function updateBaseUrl(val) {
    baseUrl = val.replace(/\/$/, '');
    loadCoffees();
  }

  /* ── Navegação ──────────────────────────────────── */
  function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`view-${name}`).classList.add('active');
    document.querySelector(`[data-view="${name}"]`).classList.add('active');

    const titles = { list: 'Catálogo de Cafés', add: 'Adicionar Café' };
    document.getElementById('viewTitle').textContent = titles[name] || '';
  }

  /* ── API helpers ─────────────────────────────────── */
  async function request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(`${baseUrl}${path}`, opts);

    // 204 No Content — sem body
    if (res.status === 204) return null;

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${data?.message || res.statusText}`);
    return data;
  }

  /* ── Status API ─────────────────────────────────── */
  function setApiStatus(online) {
    const dot  = document.getElementById('apiDot');
    const lbl  = document.getElementById('apiStatus');
    dot.className = 'dot ' + (online ? 'online' : 'offline');
    lbl.textContent = online ? 'Online' : 'Offline';
  }

  /* ── Carregar cafés ──────────────────────────────── */
  async function loadCoffees() {
    showSkeletons();
    try {
      allCoffees = await request('GET', '/coffees');
      setApiStatus(true);
      renderGrid(allCoffees);
    } catch (e) {
      setApiStatus(false);
      toast('Erro ao conectar à API', 'error');
      renderGrid([]);
    }
  }

  /* ── Filtro de busca ────────────────────────────── */
  function filterCoffees(query) {
    const q = query.toLowerCase();
    const filtered = allCoffees.filter(c =>
      c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
    renderGrid(filtered);
  }

  /* ── Render grid ────────────────────────────────── */
  function renderGrid(coffees) {
    const grid  = document.getElementById('coffeeGrid');
    const empty = document.getElementById('emptyState');

    grid.innerHTML = '';

    if (!coffees.length) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    coffees.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'coffee-card';
      card.style.animationDelay = `${i * 0.045}s`;
      card.innerHTML = `
        <div class="card-badge">☕ Café #${(i + 1).toString().padStart(2, '0')}</div>
        <div class="card-name">${escHtml(c.name)}</div>
        <div class="card-id">${escHtml(c.id)}</div>
        <div class="card-actions">
          <button class="btn-edit" onclick="App.openEdit('${escAttr(c.id)}')">Editar</button>
          <button class="btn-del"  onclick="App.openDelete('${escAttr(c.id)}', '${escAttr(c.name)}')">Remover</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /* ── Skeletons ──────────────────────────────────── */
  function showSkeletons() {
    const grid = document.getElementById('coffeeGrid');
    document.getElementById('emptyState').classList.add('hidden');
    grid.innerHTML = Array.from({ length: 6 }, () => `
      <div class="skeleton-card">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line long"></div>
        <div class="skeleton-line long"></div>
        <div class="skeleton-line short"></div>
      </div>
    `).join('');
  }

  /* ── Adicionar café ──────────────────────────────── */
  async function addCoffee() {
    const name = document.getElementById('addName').value.trim();
    const id   = document.getElementById('addId').value.trim();

    if (!name) { toast('O nome é obrigatório', 'error'); return; }

    const body = id ? { id, name } : { name };

    try {
      await request('POST', '/coffees', body);
      toast(`"${name}" adicionado com sucesso!`, 'success');
      clearAddForm();
      loadCoffees();
      showView('list');
    } catch (e) {
      toast(`Erro: ${e.message}`, 'error');
    }
  }

  function clearAddForm() {
    document.getElementById('addName').value = '';
    document.getElementById('addId').value   = '';
  }

  /* ── Editar café ────────────────────────────────── */
  function openEdit(id) {
    const c = allCoffees.find(x => x.id === id);
    if (!c) return;

    document.getElementById('editId').value       = c.id;
    document.getElementById('editName').value     = c.name;
    document.getElementById('editSubtitle').textContent = `ID: ${c.id.slice(0, 8)}…`;

    document.getElementById('editModal').classList.remove('hidden');
  }

  function closeEdit() {
    document.getElementById('editModal').classList.add('hidden');
  }

  async function saveCoffee() {
    const id   = document.getElementById('editId').value.trim();
    const name = document.getElementById('editName').value.trim();

    if (!name) { toast('O nome é obrigatório', 'error'); return; }

    try {
      await request('PUT', `/coffees/${id}`, { id, name });
      toast(`"${name}" atualizado!`, 'success');
      closeEdit();
      loadCoffees();
    } catch (e) {
      toast(`Erro: ${e.message}`, 'error');
    }
  }

  /* ── Deletar café ───────────────────────────────── */
  function openDelete(id, name) {
    deleteTarget = id;
    document.getElementById('deleteName').textContent = name;
    document.getElementById('deleteModal').classList.remove('hidden');
  }

  function closeDelete() {
    deleteTarget = null;
    document.getElementById('deleteModal').classList.add('hidden');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    closeDelete();

    try {
      await request('DELETE', `/coffees/${id}`);
      toast('Café removido', 'success');
      loadCoffees();
    } catch (e) {
      toast(`Erro: ${e.message}`, 'error');
    }
  }

  /* ── Toast ──────────────────────────────────────── */
  function toast(msg, type = 'success') {
    const area = document.getElementById('toastArea');
    const el   = document.createElement('div');
    const icons = { success: '✓', error: '✕', info: 'i' };
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || '·'}</span> ${escHtml(msg)}`;
    area.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  /* ── Escape helpers ─────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  /* ── Fechar modal clicando fora ──────────────────── */
  document.addEventListener('click', e => {
    if (e.target.id === 'editModal')   closeEdit();
    if (e.target.id === 'deleteModal') closeDelete();
  });

  /* ── Enter nos campos de formulário ─────────────── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeEdit(); closeDelete(); }
  });

  /* ── Start ──────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', init);

  /* ── API pública ─────────────────────────────────── */
  return {
    showView,
    loadCoffees,
    filterCoffees,
    updateBaseUrl,
    addCoffee,
    clearAddForm,
    openEdit,
    closeEdit,
    saveCoffee,
    openDelete,
    closeDelete,
    confirmDelete,
  };

})();
