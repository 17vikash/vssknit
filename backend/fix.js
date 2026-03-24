import fs from 'fs';
const file = 'app.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /function printDeliveryById\(id\) \{[\s\S]*?setTimeout\(\(\) => window\.print\(\), 100\);\r?\n\}/;
const fix = `function printDeliveryById(id) {
  const deliveries = getDeliveries();
  const d = deliveries.find(x => x.id === id);
  if (!d) return;

  preparePrint('deliveryChallanPrint');
  applyCompanySettingsToPrint('Del');

  document.getElementById('printDelPartyName').textContent = d.partyName || '--';
  document.getElementById('printDelDate').textContent = d.date ? new Date(d.date).toLocaleDateString('en-GB') : '--';
  document.getElementById('printDelDcNo').textContent = d.dcNo || '--';
  document.getElementById('printDelVehicleNo').textContent = d.vehicleNo || '--';
  document.getElementById('printDelTotalRoll').textContent = d.totalRoll || '0';
  document.getElementById('printDelTotalWt').textContent = parseFloat(d.totalDelWt || '0').toFixed(3);

  const firstItem = (d.items && d.items[0]) ? d.items[0] : {};
  document.getElementById('printDelOurInwNo').textContent = firstItem.inwNo || '--';
  document.getElementById('printDelProcess').textContent = firstItem.process || 'COMPACTING';
  document.getElementById('printDelOrderNo').textContent = firstItem.pOrder || '--';
  document.getElementById('printDelLotNo').textContent = firstItem.pLot || '--';

  const receivedEntries = getEntries();
  const matchedEntry = receivedEntries.find(e => String(e.inwNo) === String(firstItem.inwNo));
  if (matchedEntry) {
    document.getElementById('printDelDyDcWt').textContent = parseFloat(matchedEntry.totalDyDcWt || 0).toFixed(3);
    document.getElementById('printDelRecdDcNo2').textContent = matchedEntry.dyeingDcNo || '--';
    document.getElementById('printDelPartyDcNo').textContent = matchedEntry.partyDcNo || '--';
    const dInfo = getDyeingInfoByName(matchedEntry.dyeing);
    document.getElementById('printDelDyeingName').textContent = dInfo ? dInfo.name : (matchedEntry.dyeing || '--');
    document.getElementById('printDelReceivedWt').textContent = parseFloat(matchedEntry.ourWt || 0).toFixed(3);
  } else {
    document.getElementById('printDelDyDcWt').textContent = '0.000';
    document.getElementById('printDelRecdDcNo2').textContent = '--';
    document.getElementById('printDelPartyDcNo').textContent = '--';
    document.getElementById('printDelDyeingName').textContent = '--';
    document.getElementById('printDelReceivedWt').textContent = '0.000';
  }

  let pInfoObj = getPartyInfoByName(d.partyName || '');
  let dPAddress = document.getElementById('printDelPartyAddress');
  let dPGstLine = document.getElementById('printDelPartyGstinLine');
  let dPGst = document.getElementById('printDelPartyGst');

  if (pInfoObj) {
    if (dPAddress) dPAddress.textContent = pInfoObj.address || '';
    if (dPGst && dPGstLine) {
      if (pInfoObj.gstin) {
        dPGst.textContent = pInfoObj.gstin;
        dPGstLine.style.display = 'inline';
      } else {
        dPGstLine.style.display = 'none';
      }
    }
  } else {
    if (dPAddress) dPAddress.textContent = '';
    if (dPGstLine) dPGstLine.style.display = 'none';
  }

  const printBody = document.getElementById('printDelGridBody');
  if (printBody) {
    let rowsHtml = '';
    const items = d.items || [];
    const maxRows = 6;
    for (let i = 0; i < maxRows; i++) {
        if (i < items.length) {
            const r = items[i];
            rowsHtml += \`<tr style="height: 24px;">
        <td>\${r.pLot || '--'}</td>
        <td style="text-align: left;">\${r.fabric || '--'}</td>
        <td>998821</td>
        <td>\${r.colour || '--'}</td>
        <td>\${r.dia || '--'}</td>
        <td>\${r.roll || '0'}</td>
        <td>\${parseFloat(r.delWt || '0').toFixed(3)}</td>
      </tr>\`;
        } else {
            rowsHtml += \`<tr class="empty-row" style="height: 24px;"><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>\`;
        }
    }
    printBody.innerHTML = rowsHtml;
  }
  setTimeout(() => window.print(), 100);
}`;

if (regex.test(content)) {
    content = content.replace(regex, fix);
    fs.writeFileSync(file, content);
    console.log("Fixed syntax error.");
} else {
    console.log("Could not find the function to replace.");
}
