/* pdf-export.js
   Generates the case-file PDF entirely in the browser using jsPDF, mirroring
   the layout the server-side pdfkit version used to produce. Images are
   already stored as base64 data URLs, so they embed directly with no
   file-system access required.
*/

function hdLoadImageInfo(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 300 });
    img.onerror = () => resolve({ width: 300, height: 300 });
    img.src = dataUrl;
  });
}

function hdImageFormat(dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg|webp)/i.exec(dataUrl || '');
  if (!match) return 'JPEG';
  const ext = match[1].toUpperCase();
  return ext === 'JPG' ? 'JPEG' : ext;
}

async function generateCasePdf(record) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function addSectionHeading(text) {
    checkPageBreak(30);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(11, 61, 145);
    doc.text(text, margin, y);
    y += 4;
    doc.setDrawColor(11, 61, 145);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
  }

  function addField(label, value) {
    const shown = (value !== undefined && value !== null && value !== '') ? String(value) : 'Not provided';
    const text = `${label}: ${shown}`;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, maxWidth);
    checkPageBreak(lines.length * 13 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 6;
  }

  function addClientFields(c) {
    c = c || {};
    addField('Title', c.title);
    addField('First Name', c.firstName);
    addField('Middle Name', c.middleName);
    addField('Surname', c.surname);
    addField('Date of Birth', c.dob);
    addField('NIN', c.nin);
    addField('Email', c.email);
    addField('Phone', c.phone ? `+44 ${c.phone}` : '');
  }

  const data = record.data;

  // ---- Title block ----
  doc.setFontSize(20);
  doc.setTextColor(11, 61, 145);
  doc.text('Housing Disrepair Case File', pageWidth / 2, y, { align: 'center' });
  y += 22;
  doc.setFontSize(9);
  doc.setTextColor(85, 85, 85);
  doc.text(
    `Case ID: #${record.id}   |   Created: ${new Date(record.createdAt).toLocaleString()}   |   Updated: ${new Date(record.updatedAt).toLocaleString()}`,
    pageWidth / 2, y, { align: 'center' }
  );
  y += 22;

  addSectionHeading('Client 1 Details');
  addClientFields(data.client1);

  if (data.tenancyOccupancy === 'Joint Tenant' && data.client2) {
    addSectionHeading('Client 2 Details (Joint Tenant)');
    addClientFields(data.client2);
  }

  addSectionHeading('Quantum Questions (Disrepair Details)');
  addField('Issue Types', (data.issueTypes || []).join(', ') || 'None selected');
  addField('Disrepair Description', data.disrepairDescription);

  addSectionHeading('Qualifying Questions');
  const q = data.qualifying || {};
  addField('Reported to landlord?', q.reportedToLandlord);
  addField('First reported date', q.firstReportedDate);
  addField('Last reported date', q.lastReportedDate);
  addField('Monthly rent', q.monthlyRent !== undefined && q.monthlyRent !== '' ? `£${q.monthlyRent}` : '');
  addField('Rent arrears?', q.rentArrears);
  if (q.rentArrears === 'Yes') addField('Rent arrears amount', q.rentArrearsAmount !== '' ? `£${q.rentArrearsAmount}` : '');
  addField('Payment plan?', q.paymentPlan);
  if (q.paymentPlan === 'Yes') addField('Payment plan details', q.paymentPlanDetails);
  addField('Claimed against landlord before?', q.claimedBefore);

  addSectionHeading('Tenancy & Property Details');
  const p = data.property || {};
  addField('Property Address', p.address);
  addField('Move-in date', p.moveInDate);
  addField('Landlord Name', p.landlordName);
  addField('Tenancy Type', p.tenancyType);
  addField('England or Wales', p.country);

  addSectionHeading('Inspection & Room Report');
  const rooms = data.rooms || [];
  if (!rooms.length) {
    addField('Rooms', 'No rooms recorded.');
  }

  for (let idx = 0; idx < rooms.length; idx++) {
    const room = rooms[idx];
    checkPageBreak(24);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(26, 77, 143);
    doc.text(`Room ${idx + 1}: ${room.roomName || 'Unnamed room'}`, margin, y);
    y += 16;

    addField('Disrepair Details', room.disrepairDetails);
    addField('Causation Details', room.causationDetails);

    const images = room.images || [];
    if (images.length) {
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      checkPageBreak(14);
      doc.text(`Photos (${images.length}):`, margin, y);
      y += 10;

      const thumbWidth = 170;
      for (const dataUrl of images) {
        const info = await hdLoadImageInfo(dataUrl);
        const thumbHeight = thumbWidth * (info.height / info.width);
        checkPageBreak(thumbHeight + 10);
        try {
          doc.addImage(dataUrl, hdImageFormat(dataUrl), margin, y, thumbWidth, thumbHeight);
        } catch (e) {
          // skip images in a format jsPDF can't embed
        }
        y += thumbHeight + 10;
      }
    }
  }

  const safeName = (record.clientName || 'case').replace(/[^a-z0-9]/gi, '_');
  doc.save(`case-${record.id}-${safeName}.pdf`);
}
