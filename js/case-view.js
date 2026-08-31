hdRequireLogin();

const params = new URLSearchParams(window.location.search);
const caseId = params.get('id') ? parseInt(params.get('id'), 10) : null;

function esc(v) {
  const div = document.createElement('div');
  div.textContent = (v === undefined || v === null || v === '') ? 'Not provided' : String(v);
  return div.innerHTML;
}

function row(label, value) {
  return `<div class="view-row"><div class="vlabel">${esc(label)}</div><div class="vvalue">${esc(value)}</div></div>`;
}

function clientSectionHtml(title, client) {
  if (!client) return '';
  return `
    <div class="view-section">
      <h3>${esc(title)}</h3>
      ${row('Title', client.title)}
      ${row('First Name', client.firstName)}
      ${row('Middle Name', client.middleName)}
      ${row('Surname', client.surname)}
      ${row('Date of Birth', client.dob)}
      ${row('NIN', client.nin)}
      ${row('Email Address', client.email)}
      ${row('Phone Number', client.phone ? `+44 ${client.phone}` : '')}
    </div>
  `;
}

let currentRecord = null;

async function loadCase() {
  if (!caseId) { window.location.href = 'dashboard.html'; return; }

  const record = await getCaseById(caseId);
  if (!record) {
    alert('Case not found.');
    window.location.href = 'dashboard.html';
    return;
  }
  currentRecord = record;

  const { id, createdAt, updatedAt, data } = record;

  document.getElementById('headerTitle').textContent = `Case #${id}`;
  document.getElementById('editBtn').href = `case-form.html?id=${id}`;

  const q = data.qualifying || {};
  const p = data.property || {};
  const rooms = data.rooms || [];

  const html = `
    <div class="view-section">
      <h3>Case Summary</h3>
      ${row('Case ID', `#${id}`)}
      ${row('Date Created', new Date(createdAt).toLocaleString())}
      ${row('Last Updated', new Date(updatedAt).toLocaleString())}
      ${row('Tenancy Occupancy', data.tenancyOccupancy)}
    </div>

    ${clientSectionHtml('Client 1 Details', data.client1)}
    ${data.tenancyOccupancy === 'Joint Tenant' ? clientSectionHtml('Client 2 Details (Joint Tenant)', data.client2) : ''}

    <div class="view-section">
      <h3>Quantum Questions (Disrepair Details)</h3>
      <div style="margin-bottom:10px;">
        ${(data.issueTypes || []).map(t => `<span class="badge">${esc(t)}</span>`).join('') || 'None selected'}
      </div>
      ${row('Disrepair Description', data.disrepairDescription)}
    </div>

    <div class="view-section">
      <h3>Qualifying Questions</h3>
      ${row('Reported to landlord?', q.reportedToLandlord)}
      ${row('First reported date', q.firstReportedDate)}
      ${row('Last reported date', q.lastReportedDate)}
      ${row('Monthly rent', q.monthlyRent !== undefined && q.monthlyRent !== '' ? `£${q.monthlyRent}` : '')}
      ${row('Rent arrears?', q.rentArrears)}
      ${q.rentArrears === 'Yes' ? row('Rent arrears amount', q.rentArrearsAmount !== '' ? `£${q.rentArrearsAmount}` : '') : ''}
      ${row('Payment plan?', q.paymentPlan)}
      ${q.paymentPlan === 'Yes' ? row('Payment plan details', q.paymentPlanDetails) : ''}
      ${row('Claimed against landlord before?', q.claimedBefore)}
    </div>

    <div class="view-section">
      <h3>Tenancy & Property Details</h3>
      ${row('Property Address', p.address)}
      ${row('Move-in date', p.moveInDate)}
      ${row('Landlord Name', p.landlordName)}
      ${row('Tenancy Type', p.tenancyType)}
      ${row('England or Wales', p.country)}
    </div>

    <div class="view-section">
      <h3>Inspection & Room Report</h3>
      ${rooms.length ? rooms.map((room, idx) => `
        <div class="room-view-card">
          <h4>Room ${idx + 1}: ${esc(room.roomName)}</h4>
          ${row('Disrepair Details', room.disrepairDetails)}
          ${row('Causation Details', room.causationDetails)}
          ${(room.images && room.images.length) ? `
            <div class="gallery">
              ${room.images.map(img => `<img src="${img}" alt="room photo" onclick="window.open(this.src)">`).join('')}
            </div>
          ` : '<p style="color:#888; font-size:13px;">No photos uploaded.</p>'}
        </div>
      `).join('') : '<p>No rooms recorded.</p>'}
    </div>
  `;

  document.getElementById('caseContent').innerHTML = html;
}

document.getElementById('pdfBtn').addEventListener('click', async () => {
  if (!currentRecord) return;
  const btn = document.getElementById('pdfBtn');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Generating PDF...';
  try {
    await generateCasePdf(currentRecord);
  } catch (err) {
    console.error(err);
    alert('Could not generate PDF: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

loadCase();
