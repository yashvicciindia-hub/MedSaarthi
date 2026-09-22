const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pdfPath = path.join(root, 'assets', 'Vibcare Pharma Price List.pdf');
const htmlPath = path.join(root, 'vibcare-pharma.html');
const outputPath = path.join(root, 'vibcare-details.js');
const extractedPath = path.join(require('os').tmpdir(), 'vibcare-price-list-raw.txt');

cp.execFileSync('pdftotext', ['-raw', pdfPath, extractedPath]);
const text = fs.readFileSync(extractedPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');
const rawMatch = html.match(/const rawData = \[(.*)\];\s*\n\s*const fallbackPacking/s);
if (!rawMatch) throw new Error('Could not locate rawData in vibcare-pharma.html');
const rawData = Function(`return [${rawMatch[1]}]`)();

const divisionMap = {
  PRIMA: 'PRIMA',
  CURE: 'CURE',
  GRACE: 'GRACE',
  MIND: 'MIND',
  OPTHO: 'OPTHO',
  NURALZ: 'NURALZ'
};
const categoryMap = new Map([
  ['TABLETS', 'Tablets'],
  ['CAPSULES', 'Capsules'],
  ['SYRUPS', 'Syrups'],
  ['DRY SYRUPS', 'Dry Syrups'],
  ['LIQUID VIALS [INJ.]', 'Liquid Vials (Inj.)'],
  ['AMPOULES [INJ.]', 'Ampoules (Inj.)'],
  ['DRY INJECTIONS', 'Dry Injections'],
  ['INFUSIONS', 'Infusions'],
  ['NASAL SPRAYS / RESPULES', 'Nasal Sprays / Respules'],
  ['PROTEIN POWDERS / SACHETS', 'Protein Powders / Sachets'],
  ['GELS / OILS', 'Gels / Oils'],
  ['TUBES', 'Tubes'],
  ['TABLETS & CAPSULES', 'Tablets & Capsules'],
  ['SYRUPS, LOTIONS & POWDERS', 'Syrups, Lotions & Powders'],
  ['SOAPS', 'Soaps'],
  ['SANITIZER AND FACE MASK', 'Sanitizer and Face Mask'],
  ['DENTAL RANGE', 'Dental Range'],
  ['EYE DROPS', 'Eye Drops'],
  ['EYE OINTMENTS', 'Eye Ointments'],
  ['NASAL DROPS', 'Nasal Drops'],
  ["CHURANS, OILS AND RAS'S", 'Churans, Oils and Ras’s'],
  ['CHURANS, OILS AND RAS’S', 'Churans, Oils and Ras’s']
]);
const typePattern = /\b(ALU ALU|ALU STRIP|BLISTER|STRIP|BOTTLE|GEL|CREAM|OINTMENT|TABLET|CAPSULE|SOFTGEL|LOTION|FACE WASH|DUSTING POWDER|SHAMPOO|SOAP|LIQUID WASH|LIQUID)\b/;

function normalize(value) {
  return String(value)
    .toUpperCase()
    .replace(/TM/g, '')
    .replace(/DROPS?/g, '')
    .replace(/DRY|SYRUP/g, '')
    .replace(/SOFTGEL/g, '')
    .replace(/MONOCARTON/g, '')
    .replace(/GLYCERINE/g, '')
    .replace(/[^A-Z0-9]+/g, '');
}

const records = [];
let division = null;
let category = null;
const lines = text.split(/\r?\n/);
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i].trim();
  const divisionMatch = line.match(/^(PRIMA|CURE|GRACE|MIND|OPTHO|NURALZ)\b/i);
  if (divisionMatch) division = divisionMap[divisionMatch[1].toUpperCase()];
  const categoryKey = line.toUpperCase();
  if (categoryMap.has(categoryKey)) category = categoryMap.get(categoryKey);
  if (!/^\d+\.\s+/.test(line)) continue;

  const blockLines = [line];
  let j = i + 1;
  while (j < lines.length && !/^\s*\d+\.\s+/.test(lines[j]) && !/^(PRIMA|CURE|GRACE|MIND|OPTHO|NURALZ)\b/i.test(lines[j].trim()) && !categoryMap.has(lines[j].trim().toUpperCase()) && !/^TERMS & CONDITIONS/i.test(lines[j].trim())) {
    if (lines[j].trim()) blockLines.push(lines[j].trim());
    j += 1;
  }
  i = j - 1;
  const block = blockLines.join(' ').replace(/\s+/g, ' ').trim();
  const gstMatch = block.match(/\b(5|12|18)%/);
  if (!gstMatch || !division || !category) continue;
  const numbered = block.match(/^\d+\.\s+/)[0];
  const itemName = block.slice(numbered.length, gstMatch.index).trim();
  const afterGst = block.slice(gstMatch.index + gstMatch[0].length).trim();
  const typeMatch = afterGst.match(typePattern);
  let packing = '';
  let composition = '';
  if (typeMatch) {
    packing = afterGst.slice(0, typeMatch.index).trim();
    composition = afterGst.slice(typeMatch.index + typeMatch[0].length).trim();
  } else {
    const noTypeMatch = afterGst.match(/^(\S+(?:\s+\S+)?\s+1's)\s+(.+)$/i);
    if (noTypeMatch) {
      packing = noTypeMatch[1].replace(/\s+1's$/i, '').trim();
      composition = noTypeMatch[2].trim();
    } else {
      const firstToken = afterGst.match(/^\S+/);
      packing = firstToken ? firstToken[0] : '';
      composition = afterGst.slice(packing.length).trim();
    }
  }
  composition = composition.replace(/\s+\d+(?:\.\d+)?(?:\s*\(NET\))?\s+\d+(?:\.\d+)?\s*$/, '').trim();
  records.push({ division, category, itemName, gst: `${gstMatch[1]}%`, packing, composition });
}

const sourceRecords = new Map();
const parsedCounts = new Map();
for (const record of records) {
  const key = `${record.division}|${record.category}|${normalize(record.itemName)}`;
  if (!sourceRecords.has(key)) sourceRecords.set(key, []);
  sourceRecords.get(key).push(record);
  const countKey = `${record.division}|${record.category}`;
  parsedCounts.set(countKey, (parsedCounts.get(countKey) || 0) + 1);
}
const details = {};
let matched = 0;
let missing = 0;
const missingExamples = [];
for (const group of rawData) {
  for (const itemName of group.items) {
    const key = `${group.division}|${group.category}|${normalize(itemName)}`;
    const candidates = sourceRecords.get(key) || [];
    const detail = candidates.shift();
    const recordKey = `${group.division}|${group.category}|${itemName}`;
    if (detail) {
      details[recordKey] = { packing: detail.packing || '—', composition: detail.composition || '—', gst: detail.gst || '—' };
      matched += 1;
    } else {
      details[recordKey] = { packing: '—', composition: '—', gst: '—' };
      missing += 1;
      if (missingExamples.length < 20) missingExamples.push(recordKey);
    }
  }
}
Object.assign(details, {
  'PRIMA|Tablets|MOXIVIB CV 625™': { packing: '10x6', composition: 'Amoxycillin 500mg + Clavulanic Acid 125mg', gst: '12%' },
  'PRIMA|Tablets|MOXIVIB CV 625': { packing: '10x1x6', composition: 'Amoxycillin 500mg + Clavulanic Acid 125mg', gst: '12%' },
  'PRIMA|Capsules|RABEVIB DSR': { packing: '10x10', composition: 'Rabeprazole 20mg + Domperidone SR 30mg', gst: '12%' },
  'GRACE|Syrups, Lotions & Powders|XILOVIB 5%': { packing: '60ML', composition: 'Minoxidil Topical Solution 5%', gst: '12%' },
  'MIND|Tablets|NORMAVIB': { packing: '10x10', composition: 'Clidinium Bromide 2.5mg + Chlordiazepoxide 5mg + Dicyclomine 10mg', gst: '12%' },
  'OPTHO|Eye Drops|VIBTEARS PLUS': { packing: '10ml', composition: 'Sodium Carboxymethylcellulose 1%', gst: '12%' },
  'NURALZ|Churans, Oils and Ras’s|NONI ALOEVERA': { packing: '500ml', composition: 'Noni + Aloevera Ras', gst: '12%' }
});
fs.writeFileSync(outputPath, `window.vibcareDetails = ${JSON.stringify(details, null, 2)};\n`, 'utf8');
console.log(`PDF rows parsed: ${records.length}`);
console.log('Parsed sections:', [...parsedCounts.entries()].map(([key, count]) => `${key}=${count}`).join(', '));
console.log(`Catalogue records matched: ${matched}`);
console.log(`Catalogue records without source row: ${missing}`);
console.log('Missing examples:', missingExamples.join(' || '));
console.log(`Wrote ${path.basename(outputPath)}`);
