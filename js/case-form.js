hdRequireLogin();

const params = new URLSearchParams(window.location.search);
const caseId = params.get('id') ? parseInt(params.get('id'), 10) : null;

let roomCount = 0;

// ---------- Client field template (used for Client 1 and Client 2) ----------
function clientFieldsHtml(prefix) {
  return `
    <div class="field">
      <label>Title</label>
      <select id="${prefix}_title">
        <option value="">-- Select --</option>
        <option value="Mr">Mr</option>
        <option value="Miss">Miss</option>
        <option value="Mrs">Mrs</option>
      </select>
    </div>
    <div class="field">
      <label>First Name</label>
      <input type="text" id="${prefix}_firstName">
    </div>
    <div class="field">
      <label>Middle Name</label>
      <input type="text" id="${prefix}_middleName">
    </div>
    <div class="field">
      <label>Surname</label>
      <input type="text" id="${prefix}_surname">
    </div>
    <div class="field">
      <label>Date of Birth</label>
      <input type="date" id="${prefix}_dob">
    </div>
    <div class="field">
      <label>NIN (National Insurance Number)</label>
      <input type="text" id="${prefix}_nin">
    </div>
    <div class="field">
      <label>Email Address</label>
      <input type="email" id="${prefix}_email">
    </div>
    <div class="field">
      <label>Phone Number</label>
      <div class="phone-field">
        <span class="phone-prefix">+44</span>
        <input type="text" id="${prefix}_phone" placeholder="7123 456789">
      </div>
    </div>
  `;
}

document.getElementById('client1Fields').innerHTML = clientFieldsHtml('c1');
document.getElementById('client2Fields').innerHTML = clientFieldsHtml('c2');

// ---------- Joint tenant toggle ----------
document.querySelectorAll('input[name="tenancyOccupancy"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    document.getElementById('client2Section').style.display =
      e.target.value === 'Joint Tenant' ? 'block' : 'none';
  });
});

// ---------- Conditional fields (Section C) ----------
document.getElementById('q_rentArrears').addEventListener('change', (e) => {
  document.getElementById('rentArrearsAmountField').style.display =
    e.target.value === 'Yes' ? 'block' : 'none';
});
document.getElementById('q_paymentPlan').addEventListener('change', (e) => {
  document.getElementById('paymentPlanDetailsField').style.display =
    e.target.value === 'Yes' ? 'block' : 'none';
});

// ---------- Image helper ----------
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Room builder (Section E) ----------
function addRoom(existingRoom) {
  const idx = roomCount++;
  const wrapper = document.createElement('div');
  wrapper.className = 'room-block';
  wrapper.dataset.index = idx;
  wrapper._images = (existingRoom && existingRoom.images) ? existingRoom.images.slice() : [];

  wrapper.innerHTML = `
    <div class="room-block-header">
      <h4>Room ${idx + 1}</h4>
      <button type="button" class="btn-danger remove-room-btn">Remove Room</button>
    </div>
    <div class="form-grid single">
      <div class="field">
        <label>Room Name</label>
        <input type="text" class="room-name" placeholder="e.g. Living Room, Master Bedroom, Kitchen">
      </div>
      <div class="field">
        <label>Disrepair Details</label>
        <textarea class="room-disrepair" rows="3"></textarea>
      </div>
      <div class="field">
        <label>Causation Details</label>
        <textarea class="room-causation" rows="3"></textarea>
      </div>
      <div class="field">
        <label>Upload Pictures</label>
        <input type="file" class="room-images-input" accept="image/*" multiple>
        <div class="thumb-row"></div>
      </div>
    </div>
  `;
  document.getElementById('roomsContainer').appendChild(wrapper);

  if (existingRoom) {
    wrapper.querySelector('.room-name').value = existingRoom.roomName || '';
    wrapper.querySelector('.room-disrepair').value = existingRoom.disrepairDetails || '';
    wrapper.querySelector('.room-causation').value = existingRoom.causationDetails || '';
  }

  renderThumbs(wrapper);

  wrapper.querySelector('.remove-room-btn').addEventListener('click', () => {
    wrapper.remove();
    renumberRooms();
  });

  wrapper.querySelector('.room-images-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const dataUrls = await Promise.all(files.map(fileToDataUrl));
    wrapper._images.push(...dataUrls);
    renderThumbs(wrapper);
    e.target.value = ''; // allow re-selecting the same file later
  });
}

function renderThumbs(wrapper) {
  const row = wrapper.querySelector('.thumb-row');
  row.innerHTML = '';
  wrapper._images.forEach((dataUrl, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.innerHTML = `<img src="${dataUrl}" alt="room photo">
      <button type="button" class="remove-thumb" title="Remove photo">&times;</button>`;
    thumb.querySelector('.remove-thumb').addEventListener('click', () => {
      wrapper._images.splice(i, 1);
      renderThumbs(wrapper);
    });
    row.appendChild(thumb);
  });
}

function renumberRooms() {
  document.querySelectorAll('#roomsContainer .room-block').forEach((block, i) => {
    block.querySelector('h4').textContent = `Room ${i + 1}`;
  });
}

document.getElementById('addRoomBtn').addEventListener('click', () => addRoom());

// ---------- Populate helpers ----------
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

function fillClient(prefix, client) {
  if (!client) return;
  setVal(`${prefix}_title`, client.title);
  setVal(`${prefix}_firstName`, client.firstName);
  setVal(`${prefix}_middleName`, client.middleName);
  setVal(`${prefix}_surname`, client.surname);
  setVal(`${prefix}_dob`, client.dob);
  setVal(`${prefix}_nin`, client.nin);
  setVal(`${prefix}_email`, client.email);
  setVal(`${prefix}_phone`, client.phone);
}

// ---------- Load existing case if editing ----------
async function loadExistingCase() {
  if (!caseId) {
    addRoom(); // start with one empty room for new cases
    return;
  }

  document.getElementById('pageTitle').textContent = 'Edit Case — Housing Disrepair CRM';
  document.getElementById('headerTitle').textContent = `Edit Case #${caseId}`;
  document.getElementById('submitBtn').textContent = 'Update Case';

  const record = await getCaseById(caseId);
  if (!record) {
    alert('Case not found.');
    window.location.href = 'dashboard.html';
    return;
  }
  const data = record.data;

  document.querySelector(`input[name="tenancyOccupancy"][value="${data.tenancyOccupancy}"]`).checked = true;
  if (data.tenancyOccupancy === 'Joint Tenant') {
    document.getElementById('client2Section').style.display = 'block';
  }

  fillClient('c1', data.client1);
  fillClient('c2', data.client2);

  (data.issueTypes || []).forEach((val) => {
    const cb = document.querySelector(`input[name="issueTypes"][value="${val}"]`);
    if (cb) cb.checked = true;
  });
  setVal('disrepairDescription', data.disrepairDescription);

  const q = data.qualifying || {};
  setVal('q_reportedToLandlord', q.reportedToLandlord);
  setVal('q_firstReportedDate', q.firstReportedDate);
  setVal('q_lastReportedDate', q.lastReportedDate);
  setVal('q_monthlyRent', q.monthlyRent);
  setVal('q_rentArrears', q.rentArrears);
  setVal('q_rentArrearsAmount', q.rentArrearsAmount);
  setVal('q_paymentPlan', q.paymentPlan);
  setVal('q_paymentPlanDetails', q.paymentPlanDetails);
  setVal('q_claimedBefore', q.claimedBefore);
  if (q.rentArrears === 'Yes') document.getElementById('rentArrearsAmountField').style.display = 'block';
  if (q.paymentPlan === 'Yes') document.getElementById('paymentPlanDetailsField').style.display = 'block';

  const p = data.property || {};
  setVal('p_address', p.address);
  setVal('p_moveInDate', p.moveInDate);
  setVal('p_landlordName', p.landlordName);
  setVal('p_tenancyType', p.tenancyType);
  setVal('p_country', p.country);

  const rooms = data.rooms || [];
  if (rooms.length) {
    rooms.forEach((room) => addRoom(room));
  } else {
    addRoom();
  }
}

// ---------- Submit ----------
document.getElementById('caseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const tenancyOccupancy = document.querySelector('input[name="tenancyOccupancy"]:checked').value;

    const client1 = {
      title: document.getElementById('c1_title').value,
      firstName: document.getElementById('c1_firstName').value,
      middleName: document.getElementById('c1_middleName').value,
      surname: document.getElementById('c1_surname').value,
      dob: document.getElementById('c1_dob').value,
      nin: document.getElementById('c1_nin').value,
      email: document.getElementById('c1_email').value,
      phone: document.getElementById('c1_phone').value
    };

    let client2 = null;
    if (tenancyOccupancy === 'Joint Tenant') {
      client2 = {
        title: document.getElementById('c2_title').value,
        firstName: document.getElementById('c2_firstName').value,
        middleName: document.getElementById('c2_middleName').value,
        surname: document.getElementById('c2_surname').value,
        dob: document.getElementById('c2_dob').value,
        nin: document.getElementById('c2_nin').value,
        email: document.getElementById('c2_email').value,
        phone: document.getElementById('c2_phone').value
      };
    }

    const issueTypes = Array.from(document.querySelectorAll('input[name="issueTypes"]:checked')).map(cb => cb.value);

    const qualifying = {
      reportedToLandlord: document.getElementById('q_reportedToLandlord').value,
      firstReportedDate: document.getElementById('q_firstReportedDate').value,
      lastReportedDate: document.getElementById('q_lastReportedDate').value,
      monthlyRent: document.getElementById('q_monthlyRent').value,
      rentArrears: document.getElementById('q_rentArrears').value,
      rentArrearsAmount: document.getElementById('q_rentArrearsAmount').value,
      paymentPlan: document.getElementById('q_paymentPlan').value,
      paymentPlanDetails: document.getElementById('q_paymentPlanDetails').value,
      claimedBefore: document.getElementById('q_claimedBefore').value
    };

    const property = {
      address: document.getElementById('p_address').value,
      moveInDate: document.getElementById('p_moveInDate').value,
      landlordName: document.getElementById('p_landlordName').value,
      tenancyType: document.getElementById('p_tenancyType').value,
      country: document.getElementById('p_country').value
    };

    const roomBlocks = Array.from(document.querySelectorAll('#roomsContainer .room-block'));
    const rooms = roomBlocks.map((block) => ({
      roomName: block.querySelector('.room-name').value,
      disrepairDetails: block.querySelector('.room-disrepair').value,
      causationDetails: block.querySelector('.room-causation').value,
      images: block._images ? block._images.slice() : []
    }));

    const payload = {
      tenancyOccupancy,
      client1,
      client2,
      issueTypes,
      disrepairDescription: document.getElementById('disrepairDescription').value,
      qualifying,
      property,
      rooms
    };

    let finalId;
    if (caseId) {
      await updateExistingCase(caseId, payload);
      finalId = caseId;
    } else {
      finalId = await saveNewCase(payload);
    }

    window.location.href = `case-view.html?id=${finalId}`;
  } catch (err) {
    console.error(err);
    alert('Could not save case: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = caseId ? 'Update Case' : 'Save Case';
  }
});

loadExistingCase();
