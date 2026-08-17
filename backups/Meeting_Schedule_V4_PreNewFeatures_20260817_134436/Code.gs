/**
 * ==========================================================================
 * Code.gs - ระบบจัดการวาระงานผู้บริหารจังหวัดกำแพงเพชร (Version 4)
 * RBAC Edition — ฐานข้อมูล Google Sheet: 1GSDH5G3tgBtySItnKTOMx6CNr1Uv4-RwKxKcIZkh1v8
 * โครงสร้าง Users Sheet:
 *   A: user_id | B: username | C: password | D: fullname |
 *   E: role (Admin/Officer/Approver) | F: assigned_executive | G: status
 * ==========================================================================
 */

/* ── GIDs ─────────────────────────────────────────────────── */
var EXEC_GIDS = {
  '0': '741292453',
  '1': '1582173326',
  '2': '113001356',
  '3': '139606680',
  '4': '1475878074'
};

var USER_GID = '322794023';

/* ── Exec name → id map ─────────────────────────────────── */
var EXEC_NAMES = {
  'นายชาธิป รุจนเสรี':            0,
  'นายสวนิต สุริยกุล ณ อยุธยา':  1,
  'นายอนุชา พัสถาน':              2,
  'นายสดุดี พุทธัง':              3,
  'นายสกุลเพชร พิกุลประเสริฐ':   4,
  'นายสกลเพชร พิกุลประเสริฐ':    4
};

/* ── Helpers ──────────────────────────────────────────────── */

/** ค้นหาแผ่นงานตาม GID */
function getSheetByGid(gid) {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === String(gid)) return sheets[i];
  }
  return null;
}

/** แปลงวันที่ให้เป็นมาตรฐาน yyyy-mm-dd */
function parseDate(rawDate) {
  if (!rawDate) return '';
  if (rawDate instanceof Date) {
    var y  = rawDate.getFullYear();
    var mo = String(rawDate.getMonth() + 1).padStart(2, '0');
    var d  = String(rawDate.getDate()).padStart(2, '0');
    return y + '-' + mo + '-' + d;
  }
  var s = String(rawDate).trim();
  var p = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (p) {
    var d  = parseInt(p[1], 10);
    var mo = parseInt(p[2], 10);
    var yr = parseInt(p[3], 10);
    if (yr > 2500) yr -= 543;
    return yr + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  var p2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (p2) {
    var yr2 = parseInt(p2[1], 10);
    if (yr2 > 2500) yr2 -= 543;
    return yr2 + '-' + String(p2[2]).padStart(2, '0') + '-' + String(p2[3]).padStart(2, '0');
  }
  return s;
}

/** ทำความสะอาดข้อความเปรียบเทียบ (ตัด \r และ space ส่วนเกิน) */
function normStr(s) {
  return String(s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

/** แปลง username m1-m5 → execId 0-4 */
function usernameToExecId(username) {
  var map = { 'm1': 0, 'm2': 1, 'm3': 2, 'm4': 3, 'm5': 4 };
  return (username in map) ? map[username] : -1;
}

/** แปลง assigned_executive name → execId 0-4 */
function assignedExecToId(name) {
  name = normStr(name);
  if (name in EXEC_NAMES) return EXEC_NAMES[name];
  for (var k in EXEC_NAMES) {
    if (name.indexOf(k) >= 0 || k.indexOf(name) >= 0) return EXEC_NAMES[k];
  }
  return -1;
}

/** Capitalize first letter */
function capitalize(s) {
  if (!s) return '';
  s = String(s).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Web App Entry ────────────────────────────────────────── */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('วาระงานผู้บริหารจังหวัดกำแพงเพชร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/* ==========================================================
   USER MANAGEMENT
========================================================== */

/** ดึงรายชื่อ Users ทั้งหมด */
function getUsers() {
  var sheet = getSheetByGid(USER_GID);
  if (!sheet) return [];
  var data  = sheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[1]) continue;
    var status   = String(r[6] || 'Active').trim();
    var role     = String(r[4] || 'Officer').trim();
    var roleLC   = role.toLowerCase();
    var username = String(r[1]).trim();
    var execId   = -1;
    if (roleLC === 'officer') {
      execId = usernameToExecId(username);
      if (execId < 0) execId = assignedExecToId(String(r[5] || ''));
    }
    users.push({
      userId:      String(r[0] || '').trim(),
      username:    username,
      password:    String(r[2] || '').trim(),
      fullname:    String(r[3] || '').trim(),
      role:        roleLC,
      assignedExec:String(r[5] || 'ALL').trim(),
      status:      status,
      execId:      execId
    });
  }
  return users;
}

/** ตรวจสอบ Login Credentials */
function validateUser(username, password) {
  var sheet = getSheetByGid(USER_GID);
  if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet ผู้ใช้งาน' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var r  = data[i];
    if (!r[1]) continue;
    var un = String(r[1]).trim();
    var pw = String(r[2]).trim();
    var st = String(r[6] || 'Active').trim().toLowerCase();
    if (un === username && pw === password) {
      if (st !== 'active') return { status: 'error', message: 'บัญชีนี้ถูกปิดใช้งาน (Inactive)' };
      var role   = String(r[4] || 'Officer').trim().toLowerCase();
      var execId = -1;
      if (role === 'officer') {
        execId = usernameToExecId(un);
        if (execId < 0) execId = assignedExecToId(String(r[5] || ''));
      }
      return {
        status: 'success',
        user: {
          userId:      String(r[0] || '').trim(),
          username:    un,
          fullname:    String(r[3] || '').trim(),
          role:        role,
          assignedExec:String(r[5] || 'ALL').trim(),
          execId:      execId
        }
      };
    }
  }
  return { status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

/** สร้าง user_id ถัดไป */
function nextUserId(values) {
  var max = 0;
  for (var i = 1; i < values.length; i++) {
    var uid = String(values[i][0] || '').replace(/\D/g, '');
    var n = parseInt(uid, 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return 'U' + String(max + 1).padStart(3, '0');
}

/** เพิ่มผู้ใช้งานใหม่ */
function addUser(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = getSheetByGid(USER_GID);
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet ผู้ใช้งาน' };
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][1]).trim() === data.username) {
        return { status: 'error', message: 'Username "' + data.username + '" มีอยู่แล้ว' };
      }
    }
    var uid          = nextUserId(values);
    var assignedExec = (data.role === 'officer') ? (data.assignedExec || 'ALL') : 'ALL';
    var roleName     = capitalize(data.role);
    sheet.appendRow([
      uid, data.username, data.password, data.fullname || '',
      roleName, assignedExec, 'Active'
    ]);
    return { status: 'success' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

/** แก้ไขข้อมูลผู้ใช้งาน */
function updateUser(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = getSheetByGid(USER_GID);
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet ผู้ใช้งาน' };
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][1]).trim() === data.username) {
        var assignedExec = (data.role === 'officer') ? (data.assignedExec || 'ALL') : 'ALL';
        var roleName     = capitalize(data.role);
        var st           = data.status || 'Active';
        sheet.getRange(i + 1, 2, 1, 6).setValues([[
          data.username, data.password, data.fullname || '',
          roleName, assignedExec, st
        ]]);
        return { status: 'success' };
      }
    }
    return { status: 'error', message: 'ไม่พบผู้ใช้งาน "' + data.username + '"' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

/** ลบผู้ใช้งาน */
function deleteUser(username) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = getSheetByGid(USER_GID);
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet ผู้ใช้งาน' };
    var values = sheet.getDataRange().getValues();
    for (var i = values.length - 1; i >= 1; i--) {
      if (String(values[i][1]).trim() === username) {
        sheet.deleteRow(i + 1);
        return { status: 'success' };
      }
    }
    return { status: 'error', message: 'ไม่พบผู้ใช้งาน "' + username + '"' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

/* ==========================================================
   SCHEDULE DATA
========================================================== */

function getAllSchedules() {
  return getSchedulesFromSheet();
}

function getSchedulesFromSheet() {
  var result = [];
  for (var execId in EXEC_GIDS) {
    var gid   = EXEC_GIDS[execId];
    var sheet = getSheetByGid(gid);
    if (!sheet) continue;
    var range = sheet.getDataRange();
    if (range.getNumRows() <= 1) continue;
    var data = range.getValues();
    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (!row[0]) continue;
      var statusVal = String(row[5] || 'pending').trim().toLowerCase();
      if (statusVal !== 'approved') statusVal = 'pending';
      result.push({
        id:     'gas-' + execId + '-' + r,
        execId: parseInt(execId, 10),
        date:   parseDate(row[0]),
        time:   String(row[1] || '-'),
        detail: String(row[2] || '-'),
        venue:  String(row[3] || '-'),
        dept:   String(row[4] || '-'),
        status: statusVal,
        src:    'sheet'
      });
    }
  }
  return result;
}

function addSchedule(data) { return addScheduleToSheet(data); }

function addScheduleToSheet(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var execId = String(data.execId);
    var sheet  = getSheetByGid(EXEC_GIDS[execId]);
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet ของผู้บริหารลำดับที่ ' + execId };
    var venue  = data.venue || data.location || '';
    var status = (data.status === 'approved') ? 'approved' : 'pending';
    sheet.appendRow([data.date || '', data.time || '', data.detail || '', venue, data.dept || '', status]);
    return { status: 'success' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

function deleteSchedule(data) { return deleteScheduleFromSheet(data); }

function deleteScheduleFromSheet(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = getSheetByGid(EXEC_GIDS[String(data.execId)]);
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet' };
    var rows    = sheet.getDataRange().getValues();
    var mDate   = parseDate(data.date);
    var mTime   = normStr(data.time);
    var mDetail = normStr(data.detail);
    for (var i = rows.length - 1; i >= 1; i--) {
      if (parseDate(rows[i][0]) === mDate &&
          normStr(rows[i][1]) === mTime &&
          normStr(rows[i][2]) === mDetail) {
        sheet.deleteRow(i + 1); break;
      }
    }
    return { status: 'success' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

function updateSchedule(oldItem, newItem) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = getSheetByGid(EXEC_GIDS[String(oldItem.execId)]);
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet' };
    var values  = sheet.getDataRange().getValues();
    var mDate   = parseDate(oldItem.date);
    var mTime   = normStr(oldItem.time);
    var mDetail = normStr(oldItem.detail);
    for (var i = 1; i < values.length; i++) {
      if (parseDate(values[i][0]) === mDate &&
          normStr(values[i][1]) === mTime &&
          normStr(values[i][2]) === mDetail) {
        var curStatus = String(values[i][5] || 'pending').trim().toLowerCase();
        var newVenue  = newItem.venue || newItem.location || '';
        var newStatus = newItem.status || curStatus;
        if (newStatus !== 'approved') newStatus = 'pending';
        sheet.getRange(i + 1, 1, 1, 6).setValues([[
          newItem.date || '', newItem.time || '', newItem.detail || '',
          newVenue, newItem.dept || '', newStatus
        ]]);
        return { status: 'success' };
      }
    }
    return { status: 'error', message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

function updateScheduleStatus(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = getSheetByGid(EXEC_GIDS[String(data.execId)]);
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet' };
    var values  = sheet.getDataRange().getValues();
    var mDate   = parseDate(data.date);
    var mTime   = normStr(data.time);
    var mDetail = normStr(data.detail);
    var newStat = (data.status === 'approved') ? 'approved' : 'pending';
    for (var i = 1; i < values.length; i++) {
      if (parseDate(values[i][0]) === mDate &&
          normStr(values[i][1]) === mTime &&
          normStr(values[i][2]) === mDetail) {
        sheet.getRange(i + 1, 6).setValue(newStat);
        return { status: 'success' };
      }
    }
    return { status: 'error', message: 'ไม่พบข้อมูลที่ต้องการอัปเดต' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

function copySchedule(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    var results   = [];
    var statusVal = (data.status === 'approved') ? 'approved' : 'pending';
    for (var k = 0; k < data.targetExecIds.length; k++) {
      var tid   = String(data.targetExecIds[k]);
      var sheet = getSheetByGid(EXEC_GIDS[tid]);
      if (!sheet) { results.push({ execId: tid, ok: false }); continue; }
      var src = data.srcItem;
      sheet.appendRow([
        src.date   || '', src.time   || '', src.detail || '',
        src.venue || src.location || '', src.dept || '', statusVal
      ]);
      results.push({ execId: tid, ok: true });
    }
    return { status: 'success', results: results };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  } finally { lock.releaseLock(); }
}

/* ==========================================================
   HTTP POST Webhook
========================================================== */
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    if (action === 'get')           return json({ status: 'success', schedules: getSchedulesFromSheet() });
    if (action === 'add')           return json(addScheduleToSheet(body.data));
    if (action === 'delete')        return json(deleteScheduleFromSheet(body.data));
    if (action === 'update')        return json(updateSchedule(body.data.oldItem, body.data.newItem));
    if (action === 'updateStatus')  return json(updateScheduleStatus(body.data));
    if (action === 'copySchedule')  return json(copySchedule(body.data));
    if (action === 'validateUser')  return json(validateUser(body.username, body.password));
    if (action === 'getUsers')      return json({ status: 'success', users: getUsers() });
    if (action === 'addUser')       return json(addUser(body.data));
    if (action === 'updateUser')    return json(updateUser(body.data));
    if (action === 'deleteUser')    return json(deleteUser(body.username));
    return json({ status: 'error', message: 'Unknown action: ' + action });
  } catch(err) {
    return json({ status: 'error', message: err.toString() });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
