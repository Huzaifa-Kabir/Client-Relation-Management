/* storage.js
   All case data (including uploaded photos as base64) is persisted in the
   browser's IndexedDB via localForage. This replaces the server + SQLite
   database from the full-stack version so the whole app can run as static
   files on GitHub Pages. Data persists across visits in the same browser,
   but is local to that browser/device (there is no shared server database).
*/

localforage.config({
  name: 'HousingDisrepairCRM',
  storeName: 'cases_store'
});

const IDS_KEY = 'all_case_ids';
const COUNTER_KEY = 'next_case_id';

function buildClientName(data) {
  const c = (data && data.client1) || {};
  const parts = [c.title, c.firstName, c.surname].filter(Boolean);
  return parts.join(' ') || 'Unnamed Client';
}

async function getNextId() {
  let counter = await localforage.getItem(COUNTER_KEY);
  if (!counter) counter = 1;
  await localforage.setItem(COUNTER_KEY, counter + 1);
  return counter;
}

async function getAllCaseIds() {
  const ids = await localforage.getItem(IDS_KEY);
  return ids || [];
}

async function getAllCasesSummary() {
  const ids = await getAllCaseIds();
  const cases = [];
  for (const id of ids) {
    const record = await localforage.getItem(`case_${id}`);
    if (record) cases.push(record);
  }
  cases.sort((a, b) => b.id - a.id);
  return cases;
}

async function getCaseById(id) {
  return await localforage.getItem(`case_${id}`);
}

async function saveNewCase(data) {
  const id = await getNextId();
  const now = new Date().toISOString();
  const record = {
    id,
    clientName: buildClientName(data),
    createdAt: now,
    updatedAt: now,
    data
  };
  await localforage.setItem(`case_${id}`, record);
  const ids = await getAllCaseIds();
  ids.push(id);
  await localforage.setItem(IDS_KEY, ids);
  return id;
}

async function updateExistingCase(id, data) {
  const existing = await getCaseById(id);
  if (!existing) throw new Error('Case not found');
  const now = new Date().toISOString();
  const record = {
    ...existing,
    clientName: buildClientName(data),
    updatedAt: now,
    data
  };
  await localforage.setItem(`case_${id}`, record);
}

async function deleteCaseById(id) {
  await localforage.removeItem(`case_${id}`);
  const ids = await getAllCaseIds();
  await localforage.setItem(IDS_KEY, ids.filter((x) => x !== id));
}
