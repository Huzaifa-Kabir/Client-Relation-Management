hdRequireLogin();

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function loadCases() {
  const cases = await getAllCasesSummary();
  const tbody = document.getElementById('casesTbody');
  const emptyMsg = document.getElementById('emptyMsg');
  tbody.innerHTML = '';

  if (!cases.length) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  cases.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${c.id}</td>
      <td>${escapeHtml(c.clientName)}</td>
      <td>${new Date(c.createdAt).toLocaleDateString()}</td>
      <td>${new Date(c.updatedAt).toLocaleDateString()}</td>
      <td class="actions-cell">
        <a class="btn-small" href="case-view.html?id=${c.id}">View</a>
        <a class="btn-small" href="case-form.html?id=${c.id}">Edit</a>
        <button class="btn-danger" data-id="${c.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-danger').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this case permanently? This cannot be undone.')) return;
      await deleteCaseById(parseInt(btn.dataset.id, 10));
      loadCases();
    });
  });
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  hdLogout();
  window.location.href = 'index.html';
});

loadCases();
