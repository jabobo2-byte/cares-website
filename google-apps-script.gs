/**
 * CARES — Google Apps Script backend
 * ------------------------------------------------
 * This turns a Google Sheet into a free "database" for the CARES site.
 * It writes two kinds of rows:
 *   - Interest form submissions -> "Interest" tab
 *   - Quiz score submissions    -> "Quiz Scores" tab
 *
 * SETUP (one time, see DEPLOYMENT.md for screenshots-level detail):
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Delete any starter code and paste this whole file in.
 * 4. Click Deploy > New deployment > type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the Web App URL it gives you.
 * 6. Paste that URL into SCRIPT_URL at the top of script.js.
 */

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (data.formType === "interest") {
    const sheet = getOrCreateSheet(ss, "Interest",
      ["Timestamp", "First Name", "Last Name", "Phone", "Zip"]);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.firstName || "",
      data.lastName || "",
      data.phone || "",
      data.zip || ""
    ]);
  } else if (data.formType === "quiz") {
    const sheet = getOrCreateSheet(ss, "Quiz Scores",
      ["Timestamp", "First Name", "Last Name", "Phone", "Zip", "Score", "Total"]);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.firstName || "",
      data.lastName || "",
      data.phone || "",
      data.zip || "",
      data.score,
      data.total
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name, headerRow) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headerRow);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
