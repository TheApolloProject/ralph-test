/* ── Developer Frontend for Todo API ─────────────────────────────
   Communicates with the Express API served on the same origin.
   All CRUD operations are logged in the Request / Response panel.
─────────────────────────────────────────────────────────────────── */

const BASE_URL = window.location.origin;

// ── DOM references ────────────────────────────────────────────────
const statusDot     = document.getElementById('statusDot');
const statusLabel   = document.getElementById('statusLabel');
const statusBaseUrl = document.getElementById('statusBaseUrl');
const todoBadge     = document.getElementById('todoBadge');
const todoList      = document.getElementById('todoList');
const emptyState    = document.getElementById('emptyState');
const logEntries    = document.getElementById('logEntries');
const toast         = document.getElementById('toast');

const createForm    = document.getElementById('createForm');
const newTitle      = document.getElementById('newTitle');
const newCompleted  = document.getElementById('newCompleted');

const editCard      = document.getElementById('editCard');
const editForm      = document.getElementById('editForm');
const editId        = document.getElementById('editId');
const editTitle     = document.getElementById('editTitle');
const editCompleted = document.getElementById('editCompleted');

const cancelEdit    = document.getElementById('cancelEdit');
const refreshBtn    = document.getElementById('refreshBtn');
const clearLogBtn   = document.getElementById('clearLogBtn');
const filterPending = document.getElementById('filterPending');

// ── State ─────────────────────────────────────────────────────────
let allTodos = [];

// ── API helpers ───────────────────────────────────────────────────
async function apiRequest(method, path, body) {
  const url     = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let status, responseData, durationMs;
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    durationMs = Date.now() - start;
    status = res.status;
    // 204 has no body
    responseData = status === 204 ? null : await res.json();
  } catch (err) {
    durationMs = Date.now() - start;
    status = 0;
    responseData = { error: err.message };
  }

  addLogEntry(method, path, status, body, responseData, durationMs);
  return { status, data: responseData };
}

// ── Status check ──────────────────────────────────────────────────
async function checkStatus() {
  statusBaseUrl.textContent = BASE_URL;
  try {
    const res = await fetch(`${BASE_URL}/todos`);
    if (res.ok || res.status === 200) {
      statusDot.className   = 'status-dot online';
      statusLabel.textContent = 'API online';
    } else {
      throw new Error('Non-OK response');
    }
  } catch {
    statusDot.className   = 'status-dot offline';
    statusLabel.textContent = 'API offline';
  }
}

// ── CRUD operations ───────────────────────────────────────────────
async function fetchTodos() {
  const { status, data } = await apiRequest('GET', '/todos');
  if (status === 200) {
    allTodos = data;
    renderTodos();
  }
}

async function createTodo(title, completed) {
  const { status, data } = await apiRequest('POST', '/todos', { title, completed });
  if (status === 201) {
    allTodos.push(data);
    renderTodos();
    showToast('Todo created', 'success');
    createForm.reset();
  } else {
    const msg = data?.errors?.join(', ') || data?.error || 'Error creating todo';
    showToast(msg, 'error');
  }
}

async function updateTodo(id, fields) {
  const { status, data } = await apiRequest('PUT', `/todos/${id}`, fields);
  if (status === 200) {
    allTodos = allTodos.map(t => (t.id === id ? data : t));
    renderTodos();
    showToast('Todo updated', 'success');
    closeEditPanel();
  } else {
    const msg = data?.errors?.join(', ') || data?.error || 'Error updating todo';
    showToast(msg, 'error');
  }
}

async function toggleCompleted(id, completed) {
  const { status, data } = await apiRequest('PUT', `/todos/${id}`, { completed });
  if (status === 200) {
    allTodos = allTodos.map(t => (t.id === id ? data : t));
    renderTodos();
  } else {
    showToast('Failed to update todo', 'error');
  }
}

async function deleteTodo(id) {
  const { status } = await apiRequest('DELETE', `/todos/${id}`);
  if (status === 204) {
    allTodos = allTodos.filter(t => t.id !== id);
    renderTodos();
    showToast('Todo deleted', 'info');
  } else {
    showToast('Failed to delete todo', 'error');
  }
}

// ── Render todo list ──────────────────────────────────────────────
function renderTodos() {
  const showPending = filterPending.checked;
  const filtered = showPending ? allTodos.filter(t => !t.completed) : allTodos;

  todoBadge.textContent = filtered.length;

  // Remove existing todo items (keep emptyState)
  todoList.querySelectorAll('.todo-item').forEach(el => el.remove());

  if (filtered.length === 0) {
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach(todo => {
    const item = document.createElement('div');
    item.className = `todo-item${todo.completed ? ' completed' : ''}`;
    item.dataset.id = todo.id;

    const createdDate  = new Date(todo.createdAt).toLocaleString();
    const updatedPart  = todo.updatedAt
      ? `<span>Updated: ${new Date(todo.updatedAt).toLocaleString()}</span>`
      : '';

    item.innerHTML = `
      <input class="todo-check" type="checkbox" ${todo.completed ? 'checked' : ''}
             aria-label="Toggle completed" />
      <div class="todo-body">
        <div class="todo-title">${escapeHtml(todo.title)}</div>
        <div class="todo-meta">
          <span class="todo-id">${todo.id}</span>
          <span>Created: ${createdDate}</span>
          ${updatedPart}
        </div>
      </div>
      <div class="todo-actions">
        <button class="btn-icon" title="Edit" data-action="edit">&#9998;</button>
        <button class="btn-icon" title="Delete" data-action="delete" style="color:var(--red)">&#128465;</button>
      </div>
    `;

    // Toggle completed via checkbox
    item.querySelector('.todo-check').addEventListener('change', e => {
      toggleCompleted(todo.id, e.target.checked);
    });

    // Edit / delete buttons
    item.querySelector('[data-action="edit"]').addEventListener('click', () => openEditPanel(todo));
    item.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTodo(todo.id));

    todoList.appendChild(item);
  });
}

// ── Edit panel ────────────────────────────────────────────────────
function openEditPanel(todo) {
  editId.value        = todo.id;
  editTitle.value     = todo.title;
  editCompleted.checked = todo.completed;
  editCard.style.display = '';
  editTitle.focus();
}

function closeEditPanel() {
  editCard.style.display = 'none';
  editForm.reset();
}

// ── Log panel ─────────────────────────────────────────────────────
function addLogEntry(method, path, status, reqBody, resBody, durationMs) {
  const isOk  = status >= 200 && status < 300;
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const ts = new Date().toLocaleTimeString();

  entry.innerHTML = `
    <div class="log-entry-header">
      <span class="log-status ${isOk ? 'ok' : 'err'}">${status || 'ERR'}</span>
      <span class="log-method-path">${method} ${path}</span>
      <span class="log-time">${ts} · ${durationMs}ms</span>
    </div>
    <div class="log-entry-body">
      ${reqBody !== undefined ? `
        <div class="log-section-title">Request Body</div>
        <div class="log-json">${syntaxHighlight(reqBody)}</div>
      ` : ''}
      <div class="log-section-title">Response</div>
      <div class="log-json">${syntaxHighlight(resBody)}</div>
    </div>
  `;

  // Toggle body on header click
  entry.querySelector('.log-entry-header').addEventListener('click', () => {
    entry.querySelector('.log-entry-body').classList.toggle('open');
  });

  // Prepend so newest is at the top
  logEntries.prepend(entry);
}

// ── JSON syntax highlight ─────────────────────────────────────────
function syntaxHighlight(obj) {
  if (obj === null || obj === undefined) {
    return '<span class="json-null">null</span>';
  }
  const json = JSON.stringify(obj, null, 2);
  return json.replace(
    /("(\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    match => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-bool';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

// ── Toast ─────────────────────────────────────────────────────────
let toastTimer;
function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className   = `toast show ${type}`;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2800);
}

// ── Escape HTML ───────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Event listeners ───────────────────────────────────────────────
createForm.addEventListener('submit', e => {
  e.preventDefault();
  createTodo(newTitle.value, newCompleted.checked);
});

editForm.addEventListener('submit', e => {
  e.preventDefault();
  const fields = {};
  if (editTitle.value.trim()) fields.title = editTitle.value;
  fields.completed = editCompleted.checked;
  updateTodo(editId.value, fields);
});

cancelEdit.addEventListener('click', closeEditPanel);
refreshBtn.addEventListener('click', fetchTodos);
clearLogBtn.addEventListener('click', () => { logEntries.innerHTML = ''; });
filterPending.addEventListener('change', renderTodos);

// ── Boot ──────────────────────────────────────────────────────────
(async () => {
  await checkStatus();
  await fetchTodos();
})();
