/* ===================== storage (IndexedDB) ===================== */
const DB = (() => {
  let db;
  function open() {
    if (db) return Promise.resolve(db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('vi_notes', 1);
      r.onupgradeneeded = e => {
        const d = e.target.result;
        d.createObjectStore('insp', { keyPath: 'id' });
        const p = d.createObjectStore('photos', { keyPath: 'id' });
        p.createIndex('insp', 'inspId');
      };
      r.onsuccess = e => { db = e.target.result; res(db); };
      r.onerror = e => rej(e);
    });
  }
  const tx = (store, mode, fn) => open().then(d => new Promise((res, rej) => {
    const t = d.transaction(store, mode); const s = t.objectStore(store); const out = fn(s);
    t.oncomplete = () => res(out ? out.result : undefined);
    t.onerror = e => rej(e);
  }));
  return {
    put: (store, v) => tx(store, 'readwrite', s => s.put(v)),
    get: (store, k) => tx(store, 'readonly', s => s.get(k)),
    del: (store, k) => tx(store, 'readwrite', s => s.delete(k)),
    all: store => tx(store, 'readonly', s => s.getAll()),
    photosOf: id => open().then(d => new Promise(res => { const r = d.transaction('photos').objectStore('photos').index('insp').getAll(id); r.onsuccess = () => res(r.result); })),
  };
})();

/* ===================== helpers ===================== */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtDate = d => d ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
const today = () => new Date().toISOString().slice(0, 10);
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
const CAM_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

function blankInsp() {
  return { id: uid(), created: new Date().toISOString(), updated: new Date().toISOString(), enabled: SCHEMA.map(s => s.id), na: {}, data: {}, photoSeq: 0 };
}
const secById = id => SCHEMA.find(s => s.id === id);
const fieldOf = (sec, fid) => sec.fields.find(f => f.id === fid);

function isFilled(v) {
  if (v == null || v === '') return false;
  if (Array.isArray(v)) return v.length > 0 && v.some(isFilled);
  if (typeof v === 'object') return Object.values(v).some(isFilled);
  return true;
}
function sectionProgress(insp, sec) {
  const d = insp.data[sec.id] || {};
  let tot = 0, done = 0;
  for (const f of sec.fields) {
    if (f.type === 'heading') continue;
    if (insp.na[sec.id + '.' + headingFor(sec, f)]) continue;
    tot++; if (isFilled(d[f.id])) done++;
  }
  return { tot, done };
}
function headingFor(sec, f) { // id of nearest preceding heading (for N/A grouping)
  let h = ''; for (const x of sec.fields) { if (x.type === 'heading') h = x.id; if (x === f) return h; } return h;
}
function inspTitle(i) { const c = (i.data.case || {}); const v = (i.data.vehicle || {}); const veh = [v.year, v.make, v.model].filter(Boolean).join(' '); return (c.case || 'Untitled inspection') + (veh ? ' — ' + veh : ''); }

/* ===================== state & routing ===================== */
let S = { insp: null, sec: null, photos: [] };
window.addEventListener('hashchange', route);
async function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  $('#report').classList.add('hidden'); $('#app').classList.remove('hidden');
  if (h[0] === 'i' && h[1]) {
    if (!S.insp || S.insp.id !== h[1]) { S.insp = await DB.get('insp', h[1]); S.photos = await DB.photosOf(h[1]); }
    if (!S.insp) { location.hash = '#/'; return; }
    S.sec = h[2] && S.insp.enabled.includes(h[2]) ? h[2] : S.insp.enabled[0];
    renderInsp();
  } else if (h[0] === 'r' && h[1]) {
    if (!S.insp || S.insp.id !== h[1]) { S.insp = await DB.get('insp', h[1]); S.photos = await DB.photosOf(h[1]); }
    renderReport();
  } else { S.insp = null; renderList(); }
}

/* ===================== inspection list ===================== */
async function renderList() {
  $('#btnBack').classList.add('hidden');
  $('#ttl').textContent = 'VI Notes'; $('#sub').textContent = 'Vehicle & Scene Inspection';
  $('#topActs').innerHTML = '<button class="tb" id="btnImport">Import</button>';
  $('#btnImport').onclick = () => $('#impInput').click();
  $('#side').innerHTML = ''; $('#side').classList.add('hidden');
  const all = (await DB.all('insp')).sort((a, b) => b.updated.localeCompare(a.updated));
  let html = '<div class="wrap"><div class="list-hd"><h2 style="font-size:22px">Inspections</h2><button class="btn primary" id="btnNew">+ New Inspection</button></div>';
  if (!all.length) html += '<div class="empty"><b>No inspections yet</b>Tap New Inspection to start, or Import a previously exported .zip.</div>';
  for (const i of all) {
    let tot = 0, done = 0; for (const sid of i.enabled) { const p = sectionProgress(i, secById(sid)); tot += p.tot; done += p.done; }
    const c = i.data.case || {};
    html += `<div class="card" data-open="${i.id}"><div class="info"><div class="t">${esc(inspTitle(i))}</div><div class="m">${esc(fmtDate(c.vi_date))}${c.vi_loc ? ' · ' + esc(c.vi_loc) : ''} · updated ${new Date(i.updated).toLocaleDateString()}</div></div><div class="prog">${tot ? Math.round(done / tot * 100) : 0}%</div><button class="btn sm" data-dup="${i.id}">Copy</button><button class="btn sm danger" data-del="${i.id}">Delete</button></div>`;
  }
  $('#main').innerHTML = html + '</div>';
  $('#btnNew').onclick = async () => { const i = blankInsp(); i.data.case = { vi_date: today() }; await DB.put('insp', i); location.hash = '#/i/' + i.id; };
  $('#main').onclick = async e => {
    const del = e.target.closest('[data-del]'); const dup = e.target.closest('[data-dup]'); const op = e.target.closest('[data-open]');
    if (del) { if (confirm('Delete this inspection and all its photos? This cannot be undone.')) { const ps = await DB.photosOf(del.dataset.del); for (const p of ps) await DB.del('photos', p.id); await DB.del('insp', del.dataset.del); renderList(); } return; }
    if (dup) { const src = await DB.get('insp', dup.dataset.dup); const n = blankInsp(); n.enabled = src.enabled.slice(); n.data = { case: { ...(src.data.case || {}), vi_date: today() } }; await DB.put('insp', n); location.hash = '#/i/' + n.id; return; }
    if (op) location.hash = '#/i/' + op.dataset.open;
  };
}

/* ===================== inspection view ===================== */
let saveT;
function save() { S.insp.updated = new Date().toISOString(); clearTimeout(saveT); saveT = setTimeout(() => DB.put('insp', S.insp), 250); }
function saveNow() { S.insp.updated = new Date().toISOString(); return DB.put('insp', S.insp); }

function renderInsp() {
  const i = S.insp; $('#side').classList.remove('hidden');
  $('#btnBack').classList.remove('hidden'); $('#btnBack').onclick = () => { location.hash = '#/'; };
  $('#ttl').textContent = inspTitle(i); $('#sub').textContent = fmtDate((i.data.case || {}).vi_date);
  $('#topActs').innerHTML = '<button class="tb" id="btnExport">Export</button><button class="tb" id="btnReport">Report</button>';
  $('#btnReport').onclick = () => { location.hash = '#/r/' + i.id; };
  $('#btnExport').onclick = exportZip;
  renderSide(); renderSection();
}
function renderSide() {
  const i = S.insp;
  let h = '<div class="secs-hd"><span>Sections</span><button id="btnSecs">Edit</button></div>';
  for (const sid of i.enabled) {
    const s = secById(sid); const p = sectionProgress(i, s);
    h += `<button class="sec ${sid === S.sec ? 'on' : ''}" data-sec="${sid}"><div class="nm"><span>${esc(s.short)}</span><span class="cnt">${p.done}/${p.tot}</span></div><div class="bar"><i style="width:${p.tot ? p.done / p.tot * 100 : 0}%"></i></div></button>`;
  }
  h += `<button class="sec" data-sec="__photos"><div class="nm"><span>Photo Log</span><span class="cnt">${S.photos.length}</span></div></button>`;
  $('#side').innerHTML = h;
  $('#side').onclick = e => { const b = e.target.closest('[data-sec]'); if (b) { S.sec = b.dataset.sec; history.replaceState(null, '', '#/i/' + i.id + '/' + S.sec); renderSide(); renderSection(); window.scrollTo(0, 0); } if (e.target.id === 'btnSecs') pickSections(); };
}
function pickSections() {
  const i = S.insp;
  const html = SCHEMA.map(s => `<label><input type="checkbox" data-s="${s.id}" ${i.enabled.includes(s.id) ? 'checked' : ''} ${s.always ? 'disabled' : ''}> ${esc(s.title)}</label>`).join('');
  modal(`<h3>Sections for this inspection <button class="btn sm" data-close>Done</button></h3><div class="secpick">${html}</div>`, box => {
    box.onchange = e => { const c = e.target.closest('[data-s]'); if (!c) return; const id = c.dataset.s; if (c.checked && !i.enabled.includes(id)) i.enabled = SCHEMA.map(s => s.id).filter(x => i.enabled.includes(x) || x === id); if (!c.checked) i.enabled = i.enabled.filter(x => x !== id); save(); if (!i.enabled.includes(S.sec)) S.sec = i.enabled[0]; renderSide(); renderSection(); };
  });
}
function modal(inner, bind) {
  const host = $('#modalHost'); host.innerHTML = `<div class="modal"><div class="box">${inner}</div></div>`;
  const m = host.firstChild; const close = () => { host.innerHTML = ''; };
  m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) close(); };
  if (bind) bind(m.firstChild, close); return close;
}

/* ---------- section form ---------- */
function photosFor(sid, fid) { return S.photos.filter(p => p.sec === sid && p.field === fid).sort((a, b) => a.num - b.num); }
function camBtn(sid, fid) { const n = photosFor(sid, fid).length; return `<button class="cam ${n ? 'has' : ''}" data-cam="${fid}" type="button">${CAM_SVG}${n ? `<span class="n">${n}</span>` : ''}</button>`; }
function thumbs(sid, fid) { const ps = photosFor(sid, fid); if (!ps.length) return ''; return `<div class="thumbs">${ps.map(p => `<div class="th" data-ph="${p.id}"><img src="${p.thumb}" alt=""><b>${p.num}</b></div>`).join('')}</div>`; }

function renderSection() {
  if (S.sec === '__photos') return renderPhotoLog();
  const i = S.insp; const sec = secById(S.sec); if (!sec) return;
  const d = i.data[sec.id] = i.data[sec.id] || {};
  let h = `<div class="wrap"><div class="sec-title"><h2>${esc(sec.title)}</h2></div><div class="grid">`;
  let curHd = '';
  for (const f of sec.fields) {
    if (f.type === 'heading') {
      curHd = f.id; const na = !!i.na[sec.id + '.' + f.id];
      h += `<div class="hd" id="hd_${f.id}"><h3>${esc(f.label)}</h3><div class="r">${f.na ? `<button class="na-tog ${na ? 'on' : ''}" data-na="${f.id}" type="button">${na ? 'N/A — marked' : 'Mark N/A'}</button>` : ''}${camBtn(sec.id, f.id)}</div></div>`;
      if (photosFor(sec.id, f.id).length) h += `<div class="f full" style="padding:6px 10px">${thumbs(sec.id, f.id)}</div>`;
      continue;
    }
    const na = curHd && i.na[sec.id + '.' + curHd];
    const v = d[f.id];
    h += `<div class="f ${f.full || ['area', 'table', 'lr', 'lrsel', 'tread', 'status', 'multi'].includes(f.type) ? 'full' : ''} ${na ? 'na' : ''}" data-f="${f.id}"><div class="lbl"><span>${esc(f.label)}</span>${camBtn(sec.id, f.id)}</div><div class="body">${fieldInput(f, v)}</div>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}${thumbs(sec.id, f.id)}</div>`;
  }
  h += '</div></div>';
  h += `<div class="bottombar"><button class="btn" id="prevSec">‹ Previous</button><button class="btn primary" id="nextSec">Next Section ›</button></div>`;
  $('#main').innerHTML = h;
  bindSection(sec, d);
}
function chipsHtml(opts, sel, multi) { const on = multi ? (sel || []) : [sel]; return `<div class="chips">${opts.map(o => `<button type="button" class="chip ${on.includes(o) ? 'on' : ''}" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`; }
function fieldInput(f, v) {
  switch (f.type) {
    case 'text': return `<input class="in" data-k="" value="${esc(v)}" autocomplete="off">`;
    case 'vin': return `<div class="vinrow"><input class="in" data-k="" value="${esc(v)}" maxlength="17" autocomplete="off" autocapitalize="characters"><button class="btn" type="button" id="btnVin">Decode</button></div>`;
    case 'num': return `<input class="in" data-k="" value="${esc(v)}" inputmode="decimal" autocomplete="off">`;
    case 'date': return `<input class="in" type="date" data-k="" value="${esc(v)}">`;
    case 'area': return `<textarea class="in" data-k="" rows="${f.rows || 3}">${esc(v)}</textarea>`;
    case 'select': return chipsHtml(f.opts, v);
    case 'yn': return chipsHtml(['Yes', 'No'], v);
    case 'multi': return chipsHtml(f.opts, v, true);
    case 'status': { const o = v || {}; return `<div class="status">${chipsHtml(f.opts, o.s)}<input class="in" data-k="c" value="${esc(o.c)}" placeholder="Comment" autocomplete="off"></div>`; }
    case 'lr': { const o = v || {}; const c = f.cols || ['Left', 'Right']; return `<div class="lr"><div><label>${esc(c[0])}</label><input class="in" data-k="l" value="${esc(o.l)}" autocomplete="off"></div><div><label>${esc(c[1])}</label><input class="in" data-k="r" value="${esc(o.r)}" autocomplete="off"></div></div>`; }
    case 'lrsel': { const o = v || {}; return `<div class="lr"><div><label>Left</label><div data-sub="l">${chipsHtml(f.opts, o.l)}</div><input class="in" data-k="lc" value="${esc(o.lc)}" placeholder="Comment" style="margin-top:6px" autocomplete="off"></div><div><label>Right</label><div data-sub="r">${chipsHtml(f.opts, o.r)}</div><input class="in" data-k="rc" value="${esc(o.rc)}" placeholder="Comment" style="margin-top:6px" autocomplete="off"></div></div>`; }
    case 'tread': { const o = v || {}; return `<div class="tread">${['o:Outside', 'm:Middle', 'i:Inside'].map(x => { const [k, l] = x.split(':'); return `<div><label>${l}</label><div class="u"><input class="in" data-k="${k}" value="${esc(o[k])}" inputmode="decimal"><span>/32</span></div></div>`; }).join('')}</div>`; }
    case 'table': {
      let rows = Array.isArray(v) ? v : []; if (!rows.length) rows = f.seed ? f.seed.map(s => ({ [f.columns[0].id]: s })) : [{}];
      return `<table class="tbl"><thead><tr>${f.columns.map(c => `<th>${esc(c.label)}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r, ri) => `<tr>${f.columns.map(c => `<td><input class="in" data-row="${ri}" data-col="${c.id}" value="${esc(r[c.id])}" autocomplete="off"></td>`).join('')}<td><button class="del" type="button" data-delrow="${ri}">×</button></td></tr>`).join('')}</tbody></table><button class="btn sm addrow" type="button" data-addrow>+ Add Row</button>`;
    }
  }
  return '';
}
function bindSection(sec, d) {
  const main = $('#main'); const i = S.insp;
  // text inputs
  main.oninput = e => {
    const el = e.target; const fe = el.closest('[data-f]'); if (!fe) return; const f = fieldOf(sec, fe.dataset.f);
    if (el.dataset.row !== undefined) { const rows = tableRows(f, d); rows[+el.dataset.row][el.dataset.col] = el.value; d[f.id] = rows; }
    else if (el.dataset.k === '') d[f.id] = el.value;
    else if (el.dataset.k) { d[f.id] = Object.assign({}, d[f.id] || {}); d[f.id][el.dataset.k] = el.value; }
    save(); updateSideCount(sec);
  };
  main.onclick = async e => {
    const t = e.target;
    if (t.id === 'prevSec' || t.id === 'nextSec') { const idx = i.enabled.indexOf(S.sec); const n = i.enabled[idx + (t.id === 'nextSec' ? 1 : -1)]; if (n) { S.sec = n; history.replaceState(null, '', '#/i/' + i.id + '/' + n); renderSide(); renderSection(); window.scrollTo(0, 0); } else if (t.id === 'nextSec') { S.sec = '__photos'; renderSide(); renderSection(); } return; }
    if (t.id === 'btnVin') return decodeVin(d);
    const cam = t.closest('[data-cam]'); if (cam) return startPhoto(sec.id, cam.dataset.cam);
    const th = t.closest('[data-ph]'); if (th) return photoModal(th.dataset.ph);
    const na = t.closest('[data-na]'); if (na) { const k = sec.id + '.' + na.dataset.na; i.na[k] = !i.na[k]; save(); renderSection(); renderSide(); return; }
    const fe = t.closest('[data-f]'); if (!fe) return; const f = fieldOf(sec, fe.dataset.f);
    const chip = t.closest('[data-opt]');
    if (chip) {
      const o = chip.dataset.opt;
      if (f.type === 'multi') { const cur = Array.isArray(d[f.id]) ? d[f.id].slice() : []; const ix = cur.indexOf(o); ix >= 0 ? cur.splice(ix, 1) : cur.push(o); d[f.id] = cur; chip.classList.toggle('on'); }
      else if (f.type === 'status') { const cur = Object.assign({}, d[f.id] || {}); cur.s = cur.s === o ? '' : o; d[f.id] = cur; setChips(chip.parentElement, cur.s); }
      else if (f.type === 'lrsel') { const side = chip.closest('[data-sub]').dataset.sub; const cur = Object.assign({}, d[f.id] || {}); cur[side] = cur[side] === o ? '' : o; d[f.id] = cur; setChips(chip.parentElement, cur[side]); }
      else { d[f.id] = d[f.id] === o ? '' : o; setChips(chip.parentElement, d[f.id]); }
      save(); updateSideCount(sec); return;
    }
    if (t.closest('[data-addrow]')) { const rows = tableRows(f, d); rows.push({}); d[f.id] = rows; save(); rerenderField(sec, f, d); return; }
    const dr = t.closest('[data-delrow]'); if (dr) { const rows = tableRows(f, d); rows.splice(+dr.dataset.delrow, 1); d[f.id] = rows; save(); rerenderField(sec, f, d); return; }
  };
}
function tableRows(f, d) { let rows = Array.isArray(d[f.id]) ? d[f.id].map(r => ({ ...r })) : []; if (!rows.length) rows = f.seed ? f.seed.map(s => ({ [f.columns[0].id]: s })) : [{}]; return rows; }
function setChips(wrap, val) { wrap.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.opt === val)); }
function rerenderField(sec, f, d) { const fe = $(`#main [data-f="${f.id}"]`); if (fe) fe.querySelector('.body').innerHTML = fieldInput(f, d[f.id]); }
function updateSideCount(sec) { const p = sectionProgress(S.insp, sec); const b = $(`#side [data-sec="${sec.id}"]`); if (b) { b.querySelector('.cnt').textContent = `${p.done}/${p.tot}`; b.querySelector('.bar i').style.width = (p.tot ? p.done / p.tot * 100 : 0) + '%'; } if (sec.id === 'case' || sec.id === 'vehicle') $('#ttl').textContent = inspTitle(S.insp); }

async function decodeVin(d) {
  const vin = (d.vin || '').trim().toUpperCase(); if (vin.length !== 17) return toast('VIN must be 17 characters');
  if (!navigator.onLine) return toast('VIN decode needs a connection');
  toast('Decoding…');
  try {
    const r = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`); const j = await r.json(); const x = j.Results[0];
    const set = (k, v) => { if (v && !d[k]) d[k] = v; };
    set('year', x.ModelYear); set('make', titleCase(x.Make)); set('model', x.Model); set('trim', [x.Trim, x.Series].filter(Boolean).join(' / ')); set('body', x.BodyClass); set('doors', x.Doors ? x.Doors + ' door' : '');
    set('engine', [x.DisplacementL ? x.DisplacementL + 'L' : '', x.EngineCylinders ? x.EngineCylinders + ' cyl' : '', x.FuelTypePrimary, x.ElectrificationLevel].filter(Boolean).join(' '));
    if (x.DriveType && !d.drive) { const m = { 'FWD': 'FWD', 'RWD': 'RWD', '4WD': '4WD', 'AWD': 'AWD' }; for (const k in m) if (x.DriveType.toUpperCase().includes(k)) d.drive = m[k]; }
    if (x.TransmissionStyle && !d.trans) d.trans = /auto|cvt/i.test(x.TransmissionStyle) ? (/cvt/i.test(x.TransmissionStyle) ? 'CVT' : 'Automatic') : 'Standard';
    if (x.GVWR && !d.gvwr) { const m = x.GVWR.match(/\(([\d,]+)\s*lb/); if (m) d.gvwr = m[1].replace(/,/g, ''); }
    d.vin = vin; save(); renderSection(); renderSide(); toast(x.ErrorCode === '0' ? 'Decoded' : 'Decoded with warnings — verify');
  } catch (e) { toast('Decode failed'); }
}
const titleCase = s => (s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

/* ===================== photos ===================== */
let camTarget = null;
function startPhoto(sid, fid) {
  camTarget = { sid, fid };
  modal(`<h3>Add photo <button class="btn sm" data-close>Cancel</button></h3><div class="row"><button class="btn primary" id="pCam">${CAM_SVG} Take Photo</button><button class="btn" id="pLib">Choose from Library</button></div>`, (box, close) => {
    box.querySelector('#pCam').onclick = () => { close(); $('#camInput').click(); };
    box.querySelector('#pLib').onclick = () => { close(); $('#libInput').click(); };
  });
}
$('#camInput').onchange = $('#libInput').onchange = async e => { const files = [...e.target.files]; e.target.value = ''; if (!files.length || !camTarget) return; for (const f of files) await addPhoto(f, camTarget.sid, camTarget.fid); renderSection(); renderSide(); toast(files.length + ' photo' + (files.length > 1 ? 's' : '') + ' added'); };

function loadImg(blob) { return new Promise((res, rej) => { const u = URL.createObjectURL(blob); const im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = rej; im.src = u; }); }
function scale(im, max, q, asBlob) { const r = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * r); c.height = Math.round(im.naturalHeight * r); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return asBlob ? new Promise(res => c.toBlob(res, 'image/jpeg', q)) : c.toDataURL('image/jpeg', q); }
async function addPhoto(file, sid, fid) {
  const im = await loadImg(file);
  const thumb = scale(im, 320, .7); const rep = await scale(im, 1600, .82, true);
  S.insp.photoSeq = (S.insp.photoSeq || 0) + 1;
  const p = { id: uid(), inspId: S.insp.id, sec: sid, field: fid, num: S.insp.photoSeq, ts: new Date().toISOString(), caption: '', thumb, rep, orig: file, origName: file.name || '', type: file.type || 'image/jpeg' };
  await DB.put('photos', p); S.photos.push(p); await saveNow();
}
function photoLabel(p) { const s = secById(p.sec); const f = s && fieldOf(s, p.field); return (s ? s.title : p.sec) + (f ? ' › ' + f.label : ''); }
function photoModal(id) {
  const p = S.photos.find(x => x.id === id); if (!p) return;
  const url = URL.createObjectURL(p.rep);
  modal(`<h3>Photo ${p.num} <button class="btn sm" data-close>Done</button></h3><div class="pv"><img src="${url}" style="width:100%;height:auto;max-height:50vh;object-fit:contain"></div><div class="pi"><div class="pn">${esc(photoLabel(p))}</div><div class="hint">${new Date(p.ts).toLocaleString()}</div><input class="in" id="pCap" value="${esc(p.caption)}" placeholder="Caption"><div class="acts"><button class="btn sm" id="pMove">Move to…</button><button class="btn sm danger" id="pDel">Delete</button></div></div>`, (box, close) => {
    box.querySelector('#pCap').oninput = e => { p.caption = e.target.value; DB.put('photos', p); };
    box.querySelector('#pDel').onclick = async () => { if (!confirm('Delete photo ' + p.num + '?')) return; await DB.del('photos', p.id); S.photos = S.photos.filter(x => x.id !== p.id); close(); renderSection(); renderSide(); };
    box.querySelector('#pMove').onclick = () => { close(); movePhoto(p); };
  });
}
function movePhoto(p) {
  const opts = []; for (const sid of S.insp.enabled) { const s = secById(sid); for (const f of s.fields) opts.push(`<option value="${sid}|${f.id}" ${p.sec === sid && p.field === f.id ? 'selected' : ''}>${esc(s.short)} › ${esc(f.label)}</option>`); }
  modal(`<h3>Move photo ${p.num} <button class="btn sm" data-close>Cancel</button></h3><select class="in" id="mvSel">${opts.join('')}</select><div class="row" style="margin-top:12px"><button class="btn primary" id="mvOk">Move</button></div>`, (box, close) => {
    box.querySelector('#mvOk').onclick = async () => { const [sid, fid] = box.querySelector('#mvSel').value.split('|'); p.sec = sid; p.field = fid; await DB.put('photos', p); close(); renderSection(); renderSide(); };
  });
}
function renderPhotoLog() {
  const ps = S.photos.slice().sort((a, b) => a.num - b.num);
  let h = `<div class="wrap"><div class="sec-title"><h2>Photo Log</h2><span class="hint">${ps.length} photos</span></div>`;
  if (!ps.length) h += '<div class="empty"><b>No photos yet</b>Use the camera button on any field or section heading.</div>';
  for (const p of ps) h += `<div class="card" data-ph="${p.id}"><img src="${p.thumb}" style="width:84px;height:84px;object-fit:cover;border-radius:8px"><div class="info"><div class="t">Photo ${p.num}${p.caption ? ' — ' + esc(p.caption) : ''}</div><div class="m">${esc(photoLabel(p))}</div><div class="m">${new Date(p.ts).toLocaleString()}</div></div></div>`;
  $('#main').innerHTML = h + '</div>';
  $('#main').onclick = e => { const th = e.target.closest('[data-ph]'); if (th) photoModal(th.dataset.ph); };
  $('#main').oninput = null;
}

/* ===================== report ===================== */
function valHtml(f, v, blank) {
  if (blank) { if (f.type === 'table') return tableHtml(f, [], true); return `<div class="v blank ${f.type === 'area' ? 'tall' : ''}">${['select', 'yn', 'multi', 'status', 'lrsel'].includes(f.type) ? esc((f.opts || ['Yes', 'No']).join('  /  ')) : ''}</div>`; }
  if (!isFilled(v)) return '';
  switch (f.type) {
    case 'multi': return `<div class="v">${esc(v.join(', '))}</div>`;
    case 'status': return `<div class="v">${esc([v.s, v.c].filter(Boolean).join(' — '))}</div>`;
    case 'lr': { const c = f.cols || ['Left', 'Right']; return `<div class="v"><div class="lrv"><div><small>${esc(c[0])}</small>${esc(v.l)}</div><div><small>${esc(c[1])}</small>${esc(v.r)}</div></div></div>`; }
    case 'lrsel': return `<div class="v"><div class="lrv"><div><small>Left</small>${esc([v.l, v.lc].filter(Boolean).join(' — '))}</div><div><small>Right</small>${esc([v.r, v.rc].filter(Boolean).join(' — '))}</div></div></div>`;
    case 'tread': return `<div class="v">Outside ${esc(v.o || '—')}/32 · Middle ${esc(v.m || '—')}/32 · Inside ${esc(v.i || '—')}/32</div>`;
    case 'table': return tableHtml(f, v);
    case 'date': return `<div class="v">${esc(fmtDate(v))}</div>`;
    default: return `<div class="v">${esc(v)}</div>`;
  }
}
function tableHtml(f, rows, blank) {
  const body = blank ? Array.from({ length: 8 }, () => `<tr class="blankrows">${f.columns.map(() => '<td></td>').join('')}</tr>`).join('') : rows.filter(r => isFilled(r)).map(r => `<tr>${f.columns.map(c => `<td>${esc(r[c.id])}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${f.columns.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
}
function photosHtml(ps, urls) { if (!ps.length) return ''; return `<div class="photos">${ps.map(p => `<div class="ph"><img src="${urls[p.id]}"><b>Photo ${p.num}</b>${p.caption ? ' — ' + esc(p.caption) : ''}</div>`).join('')}</div>`; }

function renderReport() {
  const i = S.insp; $('#app').classList.add('hidden'); const R = $('#report'); R.classList.remove('hidden');
  $('#btnBack').classList.remove('hidden'); $('#btnBack').onclick = () => { location.hash = '#/i/' + i.id + '/' + (S.sec || ''); };
  $('#ttl').textContent = 'Report — ' + inspTitle(i); $('#sub').textContent = ''; $('#topActs').innerHTML = '';
  const urls = {}; for (const p of S.photos) urls[p.id] = URL.createObjectURL(p.rep);
  const opts = { blank: false, allFields: false, photos: true, log: true };
  const build = () => {
    const c = i.data.case || {}; const v = i.data.vehicle || {};
    let h = `<div class="rp-tools"><button class="btn sm" id="rpPrint">Print / Save PDF</button><label><input type="checkbox" id="oBlank" ${opts.blank ? 'checked' : ''}> Blank form (for handwriting)</label><label><input type="checkbox" id="oAll" ${opts.allFields ? 'checked' : ''}> Include empty fields</label><label><input type="checkbox" id="oPh" ${opts.photos ? 'checked' : ''}> Photos inline</label><label><input type="checkbox" id="oLog" ${opts.log ? 'checked' : ''}> Photo log</label></div><div class="rp ${opts.blank ? 'blankform' : ''}">`;
    h += `<div class="cover"><h1>Vehicle Inspection Notes</h1><div class="k"><b>Case</b><span>${esc(c.case)}</span><b>Date</b><span>${esc(fmtDate(c.vi_date))}</span><b>Vehicle</b><span>${esc([v.year, v.make, v.model, v.trim].filter(Boolean).join(' '))}</span><b>VIN</b><span>${esc(v.vin)}</span><b>Location</b><span>${esc(c.vi_loc)}</span><b>Engineers</b><span>${esc(c.vi_eng)}</span><b>Client</b><span>${esc(c.client)}</span><b>File No.</b><span>${esc(c.fileno)}</span></div></div>`;
    let first = true;
    for (const sid of i.enabled) {
      const s = secById(sid); const d = i.data[sid] || {};
      let body = ''; let grpHtml = ''; let grpBody = ''; let grpNa = false; let open = false;
      const closeGrp = () => { if (open) grpBody += '</div>'; open = false; if (grpHtml && (grpBody.trim() || grpNa || opts.allFields || opts.blank)) body += grpHtml + grpBody; else body += grpBody; grpHtml = ''; grpBody = ''; };
      for (const f of s.fields) {
        if (f.type === 'heading') {
          closeGrp(); grpNa = !!i.na[sid + '.' + f.id];
          const ps = opts.photos ? photosFor(sid, f.id) : [];
          grpHtml = `<h3>${esc(f.label)}${grpNa ? '<span class="na">NOT APPLICABLE / NOT EVALUATED</span>' : ''}</h3>`; grpBody = photosHtml(ps, urls);
          continue;
        }
        if (grpNa && !opts.blank) continue;
        const vh = valHtml(f, d[f.id], opts.blank); const ps = opts.photos && !opts.blank ? photosFor(sid, f.id) : [];
        if (!vh && !opts.allFields && !ps.length) continue;
        if (!open) { grpBody += '<div class="kv">'; open = true; }
        const wide = f.full || ['area', 'table', 'lr', 'lrsel', 'multi'].includes(f.type) || ps.length;
        grpBody += `<div class="it ${wide ? 'full' : ''}"><div class="k">${esc(f.label)}</div>${vh || '<div class="v"></div>'}</div>`;
        if (ps.length) { grpBody += `<div class="it full">${photosHtml(ps, urls)}</div>`; }
      }
      closeGrp();
      if (!body.trim() && !opts.allFields && !opts.blank) continue;
      h += `<h2 class="${first ? 'first' : ''}">${esc(s.title)}</h2>${body}`; first = false;
    }
    if (opts.log && S.photos.length && !opts.blank) {
      h += `<h2>Photo Log</h2><table class="log"><thead><tr><th>No.</th><th>Section / Item</th><th>Caption</th><th>Time</th></tr></thead><tbody>${S.photos.slice().sort((a, b) => a.num - b.num).map(p => `<tr><td>${p.num}</td><td>${esc(photoLabel(p))}</td><td>${esc(p.caption)}</td><td>${new Date(p.ts).toLocaleString()}</td></tr>`).join('')}</tbody></table>`;
    }
    h += `<div class="sig"><div>Engineer</div><div>Date</div></div><div class="foot">Generated ${new Date().toLocaleString()} · ${S.photos.length} photos · VI Notes</div></div>`;
    R.innerHTML = h;
    R.querySelector('#rpPrint').onclick = () => window.print();
    R.querySelector('#oBlank').onchange = e => { opts.blank = e.target.checked; build(); };
    R.querySelector('#oAll').onchange = e => { opts.allFields = e.target.checked; build(); };
    R.querySelector('#oPh').onchange = e => { opts.photos = e.target.checked; build(); };
    R.querySelector('#oLog').onchange = e => { opts.log = e.target.checked; build(); };
  };
  build(); window.scrollTo(0, 0);
}

/* ===================== export / import (zip) ===================== */
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return b => { let c = -1; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }; })();
function zipStore(entries) { // entries: [{name, data:Uint8Array}] -> Blob (stored, no compression)
  const parts = []; const cd = []; let off = 0; const enc = new TextEncoder();
  const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
  for (const e of entries) {
    const nm = enc.encode(e.name); const crc = CRC(e.data); const sz = e.data.length;
    const lh = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0), ...nm]);
    parts.push(lh, e.data);
    cd.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off), ...nm]));
    off += lh.length + sz;
  }
  const cdLen = cd.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length), ...u32(cdLen), ...u32(off), ...u16(0)]);
  return new Blob([...parts, ...cd, end], { type: 'application/zip' });
}
async function unzip(buf) { // supports stored (0) and deflate (8, via DecompressionStream)
  const dv = new DataView(buf); const u8 = new Uint8Array(buf); const out = {}; const dec = new TextDecoder();
  let eocd = buf.byteLength - 22; while (eocd >= 0 && dv.getUint32(eocd, true) !== 0x06054b50) eocd--; if (eocd < 0) throw new Error('bad zip');
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  for (let k = 0; k < n; k++) {
    const method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
    const lnl = dv.getUint16(lo + 26, true), lel = dv.getUint16(lo + 28, true); const start = lo + 30 + lnl + lel;
    let data = u8.slice(start, start + csz);
    if (method === 8) data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    out[name] = data; p += 46 + nl + el + cl;
  }
  return out;
}
async function exportZip() {
  const i = S.insp; toast('Packaging…');
  const meta = { app: 'vi-notes', version: 1, inspection: i, photos: S.photos.map(p => ({ id: p.id, num: p.num, sec: p.sec, field: p.field, ts: p.ts, caption: p.caption, file: `photos/P${String(p.num).padStart(3, '0')}.jpg`, origName: p.origName })) };
  const entries = [{ name: 'inspection.json', data: new TextEncoder().encode(JSON.stringify(meta, null, 1)) }];
  for (const p of S.photos) entries.push({ name: `photos/P${String(p.num).padStart(3, '0')}.jpg`, data: new Uint8Array(await p.orig.arrayBuffer()) });
  const blob = zipStore(entries); const c = i.data.case || {};
  const name = ((c.case || 'inspection').replace(/[^\w\- ]+/g, '').trim() || 'inspection') + '_' + (c.vi_date || today()) + '.zip';
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Exported ' + name);
}
$('#impInput').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    let meta, files = {};
    if (f.name.endsWith('.json')) meta = JSON.parse(await f.text()); else { files = await unzip(await f.arrayBuffer()); meta = JSON.parse(new TextDecoder().decode(files['inspection.json'])); }
    const insp = meta.inspection; const exists = await DB.get('insp', insp.id);
    if (exists && !confirm('An inspection with this ID already exists. Replace it?')) return;
    if (exists) { for (const p of await DB.photosOf(insp.id)) await DB.del('photos', p.id); }
    await DB.put('insp', insp);
    for (const pm of meta.photos || []) { const data = files[pm.file]; if (!data) continue; const blob = new Blob([data], { type: 'image/jpeg' }); const im = await loadImg(blob); const p = { id: pm.id, inspId: insp.id, sec: pm.sec, field: pm.field, num: pm.num, ts: pm.ts, caption: pm.caption || '', thumb: scale(im, 320, .7), rep: await scale(im, 1600, .82, true), orig: blob, origName: pm.origName || '', type: 'image/jpeg' }; await DB.put('photos', p); }
    S.insp = null; toast('Imported'); location.hash = '#/i/' + insp.id; route();
  } catch (err) { console.error(err); alert('Import failed: ' + err.message); }
};

/* ===================== boot ===================== */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
route();
