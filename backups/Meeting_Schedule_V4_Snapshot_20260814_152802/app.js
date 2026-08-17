/**
 * =========================================================
 * วาระงานผู้บริหารจังหวัดกำแพงเพชร — app.js
 * =========================================================
 * Features:
 *  - Read from Google Sheet (CSV export, public sheet)
 *  - Write via Google Apps Script webhook (if configured)
 *  - Fallback: JSONBin.io free cloud database
 *  - LocalStorage persistence (always works, offline-ready)
 *  - Full CRUD (Add / Edit / Delete)
 *  - Export / Import JSON backup
 *  - Thai numerals toggle
 *  - Custom date header text
 *  - Auto-sync every 30 seconds
 * =========================================================
 */

// =========================================================
// CONFIG
// =========================================================
const SPREADSHEET_ID = "1-86SIbN1LdEcHkKco-GKC-o1EdQrSyKbfUKmEOVglyc";
const LS_PREFIX = "ExecSched_";

const EXECUTIVES = [
  { id: 0, name: "นายชาธิป รุจนเสรี",            title: "ผู้ว่าราชการจังหวัดกำแพงเพชร",           gid: "741292453"   },
  { id: 1, name: "นายสุนิธิ สุริยกุล ณ อยุธยา",  title: "รองผู้ว่าราชการจังหวัดกำแพงเพชร",        gid: "1582173326"  },
  { id: 2, name: "นายอนุชา พัสสถาน",              title: "รองผู้ว่าราชการจังหวัดกำแพงเพชร",        gid: "113001356"   },
  { id: 3, name: "นายสดุดี พุธยัง",               title: "ปลัดจังหวัดกำแพงเพชร",                  gid: "139606680"   },
  { id: 4, name: "นายสกุลเพชร พิกุลประเสริฐ",     title: "หัวหน้าสำนักงานจังหวัดกำแพงเพชร",       gid: "1475878074"  }
];

const THAI_DAYS   = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const THAI_NUM    = ["๐","๑","๒","๓","๔","๕","๖","๗","๘","๙"];

// =========================================================
// STATE
// =========================================================
let S = {
  schedules: [],
  date: todayISO(),
  customTitle: "",
  thaiNum: true,
  webhookUrl: "",
  jsonbinId: "",
  jsonbinKey: "",
  syncing: false
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2,"0"); }

// =========================================================
// DOM REFS
// =========================================================
const $ = id => document.getElementById(id);
const G = {
  scheduleDate:   $("scheduleDate"),
  customTitleDate:$("customTitleDate"),
  useThaiNumerals:$("useThaiNumerals"),
  btnSync:        $("btnSync"),
  syncIcon:       $("syncIcon"),
  statusDot:      $("statusDot"),
  statusText:     $("statusText"),
  lastUpdated:    $("lastUpdated"),
  btnAdd:         $("btnAdd"),
  btnSettings:    $("btnSettings"),
  btnPrint:       $("btnPrint"),
  displayFullDate:$("displayFullDate"),
  displayFooterText:$("displayFooterText"),
  tableBody:      $("scheduleTableBody"),
  toastBox:       $("toastContainer"),
  // Agenda Modal
  agendaModal:    $("agendaModal"),
  agendaForm:     $("agendaForm"),
  btnCloseModal:  $("btnCloseModal"),
  btnCancelModal: $("btnCancelModal"),
  modalTitle:     $("modalTitle"),
  editIndex:      $("editIndex"),
  execSelect:     $("execSelect"),
  modalDate:      $("modalDate"),
  modalTime:      $("modalTime"),
  modalDetail:    $("modalDetail"),
  modalLocation:  $("modalLocation"),
  modalDept:      $("modalDept"),
  // Settings Modal
  settingsModal:  $("settingsModal"),
  btnCloseSettings:$("btnCloseSettings"),
  btnCancelSettings:$("btnCancelSettings"),
  btnSaveSettings:$("btnSaveSettings"),
  webhookUrl:     $("webhookUrl"),
  jsonbinId:      $("jsonbinId"),
  jsonbinKey:     $("jsonbinKey"),
  btnTestGas:     $("btnTestGas"),
  gasStatus:      $("gasStatus"),
  btnTestJsonbin: $("btnTestJsonbin"),
  btnSyncToJsonbin:$("btnSyncToJsonbin"),
  jsonbinStatus:  $("jsonbinStatus"),
  btnExportDb:    $("btnExportDb"),
  btnImportDb:    $("btnImportDb"),
  btnClearCustom: $("btnClearCustom"),
  importFileInput:$("importFileInput"),
  localCount:     $("localCount")
};

// =========================================================
// TOAST
// =========================================================
function toast(msg, type="success") {
  const icons = { success:"✅", error:"❌", info:"ℹ️", warn:"⚠️" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||""}</span><span>${msg}</span>`;
  G.toastBox.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// =========================================================
// THAI HELPERS
// =========================================================
function toThai(s) {
  return String(s).replace(/[0-9]/g, d => THAI_NUM[+d]);
}
function fmt(s) {
  if (s == null) return "";
  const str = String(s);
  return S.thaiNum ? toThai(str) : str;
}
function thaiDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(y, m-1, d).getDay();
  const be  = y + 543;
  const ds  = S.thaiNum ? toThai(d)  : d;
  const ys  = S.thaiNum ? toThai(be) : be;
  return `วัน${THAI_DAYS[dow]} ที่ ${ds} ${THAI_MONTHS[m-1]} พ.ศ. ${ys}`;
}
function normalDate(raw) {
  if (!raw) return "";
  const s = raw.trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    let yr = +m[3];
    if (yr > 2500) yr -= 543;
    return `${yr}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}
function bullets(text) {
  if (!text || text === "-") return "-";
  return text.split(/\r?\n/).map(l => l.trim()).filter(l => l)
    .map(l => {
      const c = l.startsWith("-") ? l.slice(1).trim() : l;
      return `<span class="bullet-item">- ${fmt(c)}</span>`;
    }).join("");
}

// =========================================================
// CSV PARSER
// =========================================================
function parseCsvLine(line) {
  const res = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
    else if (c === ',' && !inQ) { res.push(cur.trim()); cur = ""; }
    else { cur += c; }
  }
  res.push(cur.trim());
  return res;
}

// =========================================================
// GOOGLE SHEET FETCH (CSV export — read-only, no auth)
// =========================================================
async function fetchSheet(exec) {
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${exec.gid}`,
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${exec.gid}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) continue;
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length <= 1) continue;
      return lines.slice(1).map((line, i) => {
        const c = parseCsvLine(line);
        if (!c[0]) return null;
        return {
          id: `sheet-${exec.id}-${i}`,
          execId: exec.id,
          date: normalDate(c[0]),
          time: c[1] || "-",
          detail: c[2] || "-",
          location: c[3] || "-",
          dept: c[4] || "-",
          source: "sheet"
        };
      }).filter(Boolean);
    } catch(e) {
      console.warn(`Sheet fetch URL attempt failed (${exec.name}, ${url}):`, e);
    }
  }
  return [];
}

// =========================================================
// SYNC
// =========================================================
function setSyncing(v) {
  S.syncing = v;
  G.statusDot.className = "status-dot" + (v ? " syncing" : " live");
  if (v) G.syncIcon.classList.add("fa-spin-fast");
  else   G.syncIcon.classList.remove("fa-spin-fast");
  G.statusText.textContent = v ? "กำลังดึงข้อมูลจาก Google Sheet..." : "ซิงก์ข้อมูล Realtime จาก Google Sheet";
}

async function syncAll(showMsg = false) {
  if (S.syncing) return;
  setSyncing(true);

  // Try Apps Script first if URL set
  if (S.webhookUrl) {
    try {
      const res = await fetch(S.webhookUrl + "?action=get", { cache: "no-cache" });
      const json = await res.json();
      if (json.status === "success" && Array.isArray(json.schedules)) {
        mergeSheetData(json.schedules.map(x => ({ ...x, source: "sheet" })));
        finishSync(true, showMsg);
        return;
      }
    } catch(e) { console.warn("Apps Script fetch failed, trying CSV..."); }
  }

  // CSV fallback
  try {
    const results = await Promise.all(EXECUTIVES.map(fetchSheet));
    const rows = results.flat();
    if (rows.length > 0) mergeSheetData(rows);
    finishSync(rows.length > 0, showMsg);
  } catch(e) {
    setSyncing(false);
    G.syncIcon.classList.remove("fa-spin-fast");
    G.statusDot.className = "status-dot error";
    G.statusText.textContent = "ดึงข้อมูลไม่สำเร็จ (ใช้ข้อมูลในเครื่อง)";
    render();
  }
}

function mergeSheetData(rows) {
  const custom = S.schedules.filter(s => s.source === "custom");
  S.schedules = [...rows, ...custom];
  save();
  // Auto-select date if current date has no data
  const dates = [...new Set(rows.map(r => r.date).filter(Boolean))].sort();
  if (dates.length && !dates.includes(S.date)) {
    S.date = dates[0];
    G.scheduleDate.value = S.date;
  }
}

function finishSync(ok, showMsg) {
  setSyncing(false);
  const now = new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
  G.lastUpdated.textContent = `อัปเดต ${fmt(now)} น.`;
  if (showMsg) toast(ok ? "ซิงก์ข้อมูลจาก Google Sheet สำเร็จ ✅" : "ไม่พบข้อมูลใหม่ (ใช้แคช)", ok ? "success" : "warn");
  render();
}

// =========================================================
// GOOGLE APPS SCRIPT WRITE-BACK
// =========================================================
async function gasPost(action, payload) {
  if (!S.webhookUrl) return false;
  try {
    const res = await fetch(S.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload })
    });
    const json = await res.json();
    return json.status === "success";
  } catch(e) {
    console.warn("GAS post failed:", e);
    return false;
  }
}

// =========================================================
// JSONBIN.IO INTEGRATION
// =========================================================
function jsonbinHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Master-Key": S.jsonbinKey,
    "X-Bin-Versioning": "false"
  };
}
async function jsonbinPull() {
  if (!S.jsonbinId || !S.jsonbinKey) return null;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${S.jsonbinId}/latest`, { headers: { "X-Master-Key": S.jsonbinKey, "X-Bin-Meta": "false" } });
    const json = await res.json();
    return Array.isArray(json.schedules) ? json.schedules : null;
  } catch(e) { return null; }
}
async function jsonbinPush() {
  if (!S.jsonbinId || !S.jsonbinKey) return false;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${S.jsonbinId}`, {
      method: "PUT",
      headers: jsonbinHeaders(),
      body: JSON.stringify({ schedules: S.schedules })
    });
    return res.ok;
  } catch(e) { return false; }
}

// =========================================================
// LOCAL STORAGE
// =========================================================
function save() {
  try {
    localStorage.setItem(LS_PREFIX+"schedules",   JSON.stringify(S.schedules));
    localStorage.setItem(LS_PREFIX+"date",         S.date);
    localStorage.setItem(LS_PREFIX+"customTitle",  S.customTitle);
    localStorage.setItem(LS_PREFIX+"thaiNum",      S.thaiNum);
    localStorage.setItem(LS_PREFIX+"webhookUrl",   S.webhookUrl);
    localStorage.setItem(LS_PREFIX+"jsonbinId",    S.jsonbinId);
    localStorage.setItem(LS_PREFIX+"jsonbinKey",   S.jsonbinKey);
  } catch(e) {}
}
function load() {
  try {
    const d = localStorage.getItem(LS_PREFIX+"schedules");
    if (d) S.schedules = JSON.parse(d);
    S.date        = localStorage.getItem(LS_PREFIX+"date")        || S.date;
    S.customTitle = localStorage.getItem(LS_PREFIX+"customTitle") || "";
    S.thaiNum     = localStorage.getItem(LS_PREFIX+"thaiNum")    !== "false";
    S.webhookUrl  = localStorage.getItem(LS_PREFIX+"webhookUrl") || "";
    S.jsonbinId   = localStorage.getItem(LS_PREFIX+"jsonbinId")  || "";
    S.jsonbinKey  = localStorage.getItem(LS_PREFIX+"jsonbinKey") || "";
  } catch(e) {}
}

// =========================================================
// RENDER TABLE
// =========================================================
function render() {
  // Header date
  if (S.customTitle.trim()) {
    G.displayFullDate.textContent = fmt(S.customTitle.trim());
  } else {
    G.displayFullDate.textContent = thaiDate(S.date);
  }
  // Footer
  G.displayFooterText.textContent = fmt("กลุ่มงานอำนวยการ สำนักงานจังหวัดกำแพงเพชร โทร 0-5570-5004 โทร(มท.) 16120");

  const tbody = G.tableBody;
  tbody.innerHTML = "";

  EXECUTIVES.forEach(exec => {
    // Executive banner
    const hr = document.createElement("tr");
    hr.className = "exec-row-header";
    hr.innerHTML = `<td colspan="4">${exec.name}  ${exec.title}</td>`;
    tbody.appendChild(hr);

    const items = S.schedules.filter(s => s.execId === exec.id && s.date === S.date);
    if (!items.length) {
      const er = document.createElement("tr");
      er.className = "empty-row";
      er.innerHTML = `<td>-</td><td>-</td><td>-</td><td>-</td>`;
      tbody.appendChild(er);
    } else {
      items.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="cell-time">${fmt(item.time)}</td>
          <td class="cell-detail">
            ${bullets(item.detail)}
            <span class="row-actions no-print">
              <button class="btn-icon btn-edit"   onclick="openEdit('${item.id}')" title="แก้ไข"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="btn-icon btn-delete" onclick="del('${item.id}')"      title="ลบ"><i class="fa-solid fa-trash"></i></button>
            </span>
          </td>
          <td class="cell-location">${bullets(item.location)}</td>
          <td class="cell-dept">${fmt(item.dept)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  });
}

// =========================================================
// CRUD
// =========================================================
function openAdd() {
  G.modalTitle.innerHTML = `<i class="fa-solid fa-calendar-plus"></i> เพิ่มวาระงานปฏิบัติราชการ`;
  G.editIndex.value  = "-1";
  G.execSelect.value = "0";
  G.modalDate.value  = S.date;
  G.modalTime.value  = "";
  G.modalDetail.value= "";
  G.modalLocation.value = "";
  G.modalDept.value  = "";
  G.agendaModal.classList.add("active");
}

function openEdit(id) {
  const item = S.schedules.find(s => s.id === id);
  if (!item) return;
  G.modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> แก้ไขวาระงานปฏิบัติราชการ`;
  G.editIndex.value  = id;
  G.execSelect.value = item.execId;
  G.modalDate.value  = item.date;
  G.modalTime.value  = item.time;
  G.modalDetail.value= item.detail;
  G.modalLocation.value = item.location || "";
  G.modalDept.value  = item.dept || "";
  G.agendaModal.classList.add("active");
}

function closeAgendaModal() { G.agendaModal.classList.remove("active"); }

function del(id) {
  if (!confirm("ต้องการลบวาระงานนี้?")) return;
  const item = S.schedules.find(s => s.id === id);
  S.schedules = S.schedules.filter(s => s.id !== id);
  save();
  render();
  toast("ลบวาระงานเรียบร้อย", "info");
  // Write-back
  if (item && S.webhookUrl) gasPost("delete", item);
  if (S.jsonbinId) jsonbinPush();
}

G.agendaForm.addEventListener("submit", async e => {
  e.preventDefault();
  const eid = G.editIndex.value;
  const payload = {
    execId:   +G.execSelect.value,
    date:     G.modalDate.value,
    time:     G.modalTime.value.trim(),
    detail:   G.modalDetail.value.trim(),
    location: G.modalLocation.value.trim() || "-",
    dept:     G.modalDept.value.trim()     || "-"
  };

  if (eid === "-1") {
    S.schedules.push({ id: `c-${Date.now()}`, ...payload, source: "custom" });
    toast("เพิ่มวาระงานสำเร็จ ✅");
  } else {
    const i = S.schedules.findIndex(s => s.id === eid);
    if (i > -1) S.schedules[i] = { ...S.schedules[i], ...payload, source: "custom" };
    toast("แก้ไขวาระงานสำเร็จ ✅");
  }

  S.date = payload.date;
  G.scheduleDate.value = payload.date;
  save();
  closeAgendaModal();
  render();

  // Write-back
  if (S.webhookUrl) {
    const ok = await gasPost("add", payload);
    if (ok) toast("บันทึกลง Google Sheet สำเร็จ 📊", "info");
  }
  if (S.jsonbinId) jsonbinPush();
});

// =========================================================
// SETTINGS MODAL
// =========================================================
function openSettings() {
  G.webhookUrl.value  = S.webhookUrl;
  G.jsonbinId.value   = S.jsonbinId;
  G.jsonbinKey.value  = S.jsonbinKey;
  G.localCount.textContent = S.schedules.length;
  G.gasStatus.textContent   = "";
  G.jsonbinStatus.textContent = "";
  G.settingsModal.classList.add("active");
}
function closeSettings() { G.settingsModal.classList.remove("active"); }

// Settings Tabs
document.querySelectorAll(".stab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".stab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    $("tab-"+tab.dataset.tab).classList.add("active");
  });
});

G.btnSaveSettings.addEventListener("click", () => {
  S.webhookUrl = G.webhookUrl.value.trim();
  S.jsonbinId  = G.jsonbinId.value.trim();
  S.jsonbinKey = G.jsonbinKey.value.trim();
  save();
  closeSettings();
  toast("บันทึกการตั้งค่าเรียบร้อย ✅");
});

// Test Apps Script connection
G.btnTestGas.addEventListener("click", async () => {
  const url = G.webhookUrl.value.trim();
  if (!url) { G.gasStatus.className="status-msg err"; G.gasStatus.textContent="❌ กรุณาใส่ URL ก่อน"; return; }
  G.gasStatus.className="status-msg"; G.gasStatus.textContent="⏳ กำลังทดสอบ...";
  try {
    const res = await fetch(url, { cache:"no-cache" });
    const text = await res.text();
    if (res.ok) {
      G.gasStatus.className="status-msg ok";
      G.gasStatus.textContent="✅ เชื่อมต่อสำเร็จ! (" + res.status + ")";
    } else {
      G.gasStatus.className="status-msg err";
      G.gasStatus.textContent="❌ HTTP " + res.status;
    }
  } catch(e) {
    G.gasStatus.className="status-msg err";
    G.gasStatus.textContent="❌ ไม่สามารถเชื่อมต่อได้: " + e.message;
  }
});

// Test JSONBin
G.btnTestJsonbin.addEventListener("click", async () => {
  const id  = G.jsonbinId.value.trim();
  const key = G.jsonbinKey.value.trim();
  if (!id || !key) { G.jsonbinStatus.className="status-msg err"; G.jsonbinStatus.textContent="❌ กรุณาใส่ BIN ID และ API Key"; return; }
  G.jsonbinStatus.className="status-msg"; G.jsonbinStatus.textContent="⏳ กำลังทดสอบ...";
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${id}/latest`, { headers: { "X-Master-Key": key, "X-Bin-Meta": "false" } });
    if (res.ok) {
      G.jsonbinStatus.className="status-msg ok";
      G.jsonbinStatus.textContent="✅ เชื่อมต่อ JSONBin สำเร็จ!";
    } else {
      G.jsonbinStatus.className="status-msg err";
      G.jsonbinStatus.textContent="❌ HTTP " + res.status + " — ตรวจสอบ BIN ID และ API Key";
    }
  } catch(e) {
    G.jsonbinStatus.className="status-msg err";
    G.jsonbinStatus.textContent="❌ " + e.message;
  }
});

// Push to JSONBin
G.btnSyncToJsonbin.addEventListener("click", async () => {
  S.jsonbinId  = G.jsonbinId.value.trim();
  S.jsonbinKey = G.jsonbinKey.value.trim();
  G.jsonbinStatus.textContent = "⏳ กำลัง Push...";
  const ok = await jsonbinPush();
  G.jsonbinStatus.className = ok ? "status-msg ok" : "status-msg err";
  G.jsonbinStatus.textContent = ok ? "✅ Push ขึ้น JSONBin สำเร็จ!" : "❌ Push ล้มเหลว";
  if (ok) toast("อัปโหลดข้อมูลไปยัง JSONBin สำเร็จ ☁️", "success");
});

// Export
G.btnExportDb.addEventListener("click", () => {
  const json = JSON.stringify(S.schedules, null, 2);
  const url  = "data:application/json;charset=utf-8," + encodeURIComponent(json);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `ExecSchedule_${S.date}.json`;
  a.click();
  toast("ส่งออกไฟล์ JSON สำเร็จ 💾");
});

// Import
G.btnImportDb.addEventListener("click", () => G.importFileInput.click());
G.importFileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data)) {
        S.schedules = data;
        save();
        render();
        toast("นำเข้าฐานข้อมูลสำเร็จ! " + data.length + " รายการ ✅");
        closeSettings();
      } else {
        toast("รูปแบบไฟล์ไม่ถูกต้อง (ต้องเป็น Array)", "error");
      }
    } catch(err) {
      toast("อ่านไฟล์ JSON ไม่สำเร็จ: " + err.message, "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

// Clear custom
G.btnClearCustom.addEventListener("click", () => {
  if (!confirm("ต้องการล้างข้อมูลวาระงานที่เพิ่มเองทั้งหมด (ข้อมูลจาก Google Sheet จะยังอยู่)?")) return;
  S.schedules = S.schedules.filter(s => s.source !== "custom");
  save();
  render();
  toast("ล้างข้อมูลที่เพิ่มเองเรียบร้อย", "info");
  G.localCount.textContent = S.schedules.length;
});

// =========================================================
// EVENT LISTENERS
// =========================================================
G.scheduleDate.addEventListener("change", e => {
  S.date = e.target.value; save(); render();
});
G.customTitleDate.addEventListener("input", e => {
  S.customTitle = e.target.value; save(); render();
});
G.useThaiNumerals.addEventListener("change", e => {
  S.thaiNum = e.target.checked; save(); render();
});
G.btnSync.addEventListener("click", () => syncAll(true));
G.btnAdd.addEventListener("click", openAdd);
G.btnSettings.addEventListener("click", openSettings);
G.btnPrint.addEventListener("click", () => window.print());

G.btnCloseModal.addEventListener("click", closeAgendaModal);
G.btnCancelModal.addEventListener("click", closeAgendaModal);
G.agendaModal.addEventListener("click", e => { if (e.target === G.agendaModal) closeAgendaModal(); });

G.btnCloseSettings.addEventListener("click", closeSettings);
G.btnCancelSettings.addEventListener("click", closeSettings);
G.settingsModal.addEventListener("click", e => { if (e.target === G.settingsModal) closeSettings(); });

// =========================================================
// INIT
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  load();

  // Restore UI state
  G.scheduleDate.value    = S.date;
  G.customTitleDate.value = S.customTitle;
  G.useThaiNumerals.checked = S.thaiNum;

  render();
  syncAll(false);
  setInterval(() => syncAll(false), 30000);
});
