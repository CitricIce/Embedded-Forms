/**
 * Sheet Forms backend.
 * Paste this into Extensions > Apps Script on the Google Sheet you want to fill.
 * Deploy as a Web App (Execute as: Me, Who has access: Anyone).
 */

// ---- Config ---------------------------------------------------------------

// Tabs a form is allowed to write to. A form picks one with a hidden "_sheet" field.
// Missing tabs in this list get created on first submission.
var ALLOWED_SHEETS = ['Submissions'];
var DEFAULT_SHEET = 'Submissions';

// Optional. Put an email here to get a message for every submission.
var NOTIFY_EMAIL = '';

// Reject submissions sent faster than this after the page loaded (bots).
var MIN_FILL_MS = 1500;

// ---------------------------------------------------------------------------

var META_FIELDS = ['_sheet', '_hp', '_t', '_page'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var params = (e && e.parameters) || {};
    var first = function (k) { return params[k] ? String(params[k][0]) : ''; };

    // Honeypot: real people never fill this hidden field.
    if (first('_hp')) return json({ ok: true });

    var started = Number(first('_t'));
    if (started && Date.now() - started < MIN_FILL_MS) return json({ ok: true });

    var sheetName = first('_sheet') || DEFAULT_SHEET;
    if (ALLOWED_SHEETS.indexOf(sheetName) === -1) {
      return json({ ok: false, error: 'Unknown form target' });
    }

    // Collect fields in the order the form sent them.
    var data = {};
    Object.keys(params).forEach(function (key) {
      if (META_FIELDS.indexOf(key) !== -1) return;
      data[key] = params[key].map(clean).join(', ');
    });
    if (Object.keys(data).length === 0) {
      return json({ ok: false, error: 'Empty submission' });
    }
    data['Timestamp'] = new Date();
    data['Page'] = clean(first('_page'));

    lock.waitLock(20000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    var headers = getHeaders(sheet);
    if (headers.length === 0) headers = ['Timestamp'];
    // Add a column for any field the sheet hasn't seen yet.
    Object.keys(data).forEach(function (key) {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    var row = headers.map(function (h) { return h in data ? data[h] : ''; });
    sheet.appendRow(row);
    lock.releaseLock();

    if (NOTIFY_EMAIL) notify(sheetName, data);
    return json({ ok: true });
  } catch (err) {
    try { lock.releaseLock(); } catch (_) {}
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json({ ok: true, message: 'Sheet Forms endpoint is running' });
}

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(String)
    .filter(function (h) { return h !== ''; });
}

// Stop people from injecting spreadsheet formulas like =IMPORTXML(...).
function clean(value) {
  var s = String(value).slice(0, 5000);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function notify(sheetName, data) {
  var body = Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
  MailApp.sendEmail(NOTIFY_EMAIL, 'New form submission (' + sheetName + ')', body);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
