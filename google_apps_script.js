/**
 * ==========================================================================
 * Code.gs - ระบบจัดการวาระงานผู้บริหารจังหวัดกำแพงเพชร (Version 3)
 * ==========================================================================
 */

var EXEC_GIDS = {
  '0': '741292453',
  '1': '1582173326',
  '2': '113001356',
  '3': '139606680',
  '4': '1475878074'
};

/** ค้นหาแผ่นงานตาม GID */
function getSheetByGid(gid) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === String(gid)) {
      return sheets[i];
    }
  }
  return null;
}

/** แปลง/ฟอร์แมตวันที่ให้เป็นมาตรฐาน yyyy-mm-dd */
function parseDate(rawDate) {
  if (!rawDate) return "";
  if (rawDate instanceof Date) {
    var y = rawDate.getFullYear();
    var mo = String(rawDate.getMonth() + 1).padStart(2, '0');
    var d  = String(rawDate.getDate()).padStart(2, '0');
    return y + "-" + mo + "-" + d;
  }
  var dateStr = String(rawDate).trim();
  var parts = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (parts) {
    var yr = parseInt(parts[3], 10);
    if (yr > 2500) yr -= 543;
    return yr + "-" + parts[2].padStart(2,'0') + "-" + parts[1].padStart(2,'0');
  }
  return dateStr;
}

/** บริการหน้าเว็บ HTML สำหรับ Apps Script Web App */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('วาระงานผู้บริหารจังหวัดกำแพงเพชร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/** ดึงข้อมูลวาระงานทั้งหมด (ใช้โดย google.script.run) */
function getAllSchedules() {
  return getSchedulesFromSheet();
}

/** ดึงข้อมูลวาระงานทั้งหมดจากทั้ง 5 แผ่นงาน */
function getSchedulesFromSheet() {
  var result = [];

  for (var execId in EXEC_GIDS) {
    var gid = EXEC_GIDS[execId];
    var sheet = getSheetByGid(gid);
    if (!sheet) continue;

    var range = sheet.getDataRange();
    if (range.getNumRows() <= 1) continue; // ข้ามถ้าระบบว่างเปล่า (มีเฉพาะหัวตาราง)
    
    var data = range.getValues();

    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      if (!row[0]) continue;

      result.push({
        id:     'gas-' + execId + '-' + r,
        execId: parseInt(execId, 10),
        date:   parseDate(row[0]),
        time:   String(row[1] || "-"),
        detail: String(row[2] || "-"),
        venue:  String(row[3] || "-"),
        dept:   String(row[4] || "-"),
        src:    'sheet'
      });
    }
  }

  return result;
}

/** เพิ่มวาระงาน (ใช้โดย google.script.run) */
function addSchedule(data) {
  return addScheduleToSheet(data);
}

/** เพิ่มวาระงานลงในแผ่นงาน Google Sheet */
function addScheduleToSheet(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var execId = String(data.execId);
    var gid = EXEC_GIDS[execId];
    var sheet = getSheetByGid(gid);
    if (!sheet) return { status: "error", message: "ไม่พบ Sheet ของผู้บริหารลำดับที่ " + execId };

    // รองรับทั้ง venue และ location
    var venue = data.venue || data.location || "";

    sheet.appendRow([
      data.date   || "",
      data.time   || "",
      data.detail || "",
      venue,
      data.dept   || ""
    ]);

    return { status: "success" };
  } catch(err) {
    return { status: "error", message: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/** ลบวาระงาน (ใช้โดย google.script.run) */
function deleteSchedule(data) {
  return deleteScheduleFromSheet(data);
}

/** ลบวาระงานออกจากแผ่นงาน Google Sheet */
function deleteScheduleFromSheet(data) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var execId = String(data.execId);
    var gid = EXEC_GIDS[execId];
    var sheet = getSheetByGid(gid);
    if (!sheet) return { status: "error", message: "ไม่พบ Sheet" };

    var rows = sheet.getDataRange().getValues();
    var matchTime = String(data.time).trim();
    var matchDetail = String(data.detail).trim();
    var matchDateStr = parseDate(data.date);

    for (var i = rows.length - 1; i >= 1; i--) {
      var rowDateStr = parseDate(rows[i][0]);
      if (rowDateStr === matchDateStr && String(rows[i][1]).trim() === matchTime && String(rows[i][2]).trim() === matchDetail) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return { status: "success" };
  } catch(err) {
    return { status: "error", message: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/** แก้ไขวาระงานสะกดแบบ In-place (ใช้โดย google.script.run) */
function updateSchedule(oldItem, newItem) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var execId = String(oldItem.execId);
    var gid = EXEC_GIDS[execId];
    var sheet = getSheetByGid(gid);
    if (!sheet) return { status: "error", message: "ไม่พบ Sheet" };

    var range = sheet.getDataRange();
    var values = range.getValues();
    
    var matchTime = String(oldItem.time).trim();
    var matchDetail = String(oldItem.detail).trim();
    var matchDateStr = parseDate(oldItem.date);

    for (var i = 1; i < values.length; i++) {
      var rowDateStr = parseDate(values[i][0]);
      if (rowDateStr === matchDateStr && String(values[i][1]).trim() === matchTime && String(values[i][2]).trim() === matchDetail) {
        var targetRowIndex = i + 1;
        
        var newDate = newItem.date || "";
        var newTime = newItem.time || "";
        var newDetail = newItem.detail || "";
        var newVenue = newItem.venue || newItem.location || "";
        var newDept = newItem.dept || "";
        
        sheet.getRange(targetRowIndex, 1, 1, 5).setValues([[
          newDate,
          newTime,
          newDetail,
          newVenue,
          newDept
        ]]);
        
        return { status: "success" };
      }
    }
    
    return { status: "error", message: "ไม่พบข้อมูลที่ต้องการแก้ไข" };
  } catch(err) {
    return { status: "error", message: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/** รองรับ HTTP POST / Webhook สำหรับการเรียกใช้ผ่านระบบภายนอก */
function doPost(e) {
  try {
    var data   = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "add") {
      return json(addScheduleToSheet(data.data));
    } else if (action === "delete") {
      return json(deleteScheduleFromSheet(data.data));
    } else if (action === "update") {
      return json(updateSchedule(data.data.oldItem, data.data.newItem));
    } else if (action === "get") {
      return json({ status: "success", schedules: getSchedulesFromSheet() });
    }
    return json({ status: "error", message: "Unknown action" });
  } catch(err) {
    return json({ status: "error", message: err.toString() });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
