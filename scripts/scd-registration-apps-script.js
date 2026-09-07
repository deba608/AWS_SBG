/**
 * AWS Student Community Day SUIIT 2026 — pre-registration backend.
 *
 * SETUP (organizer, one time, ~10 min):
 * 1. Create a Google Sheet (owned by the lead's account).
 * 2. Extensions > Apps Script > delete the default code > paste this file.
 * 3. Deploy > New deployment > type "Web app":
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Deploy, authorize, copy the Web App URL (/exec).
 * 4. Paste the URL into `.env.local` as NEXT_PUBLIC_SCD_SHEET_URL
 *    (see `.env.example`). Never commit the URL.
 * 5. Test: open the URL in a browser → should show {"status":"ok",...}.
 *    Then submit the site form once and check the "Registrations" tab.
 *
 * Sheet layout (auto-created):
 *   Timestamp | First Name | Last Name | Email | Mobile | Source
 * Duplicates (same email OR mobile) return {status:"duplicate"} instead of
 * appending a second row.
 *
 * MIGRATION from the old single-Name layout:
 *   If your "Registrations" tab still has the old header
 *   (Timestamp | Name | Email | Mobile | Source), delete that tab entirely —
 *   the script recreates it in the new format on the next submit.
 *   (Or redeploy: Deploy > Manage deployments > Edit > New version.)
 *   After ANY edit to this file you must redeploy a NEW VERSION,
 *   otherwise /exec keeps serving the old code.
 */

var SHEET_NAME = "Registrations";
var HEADERS = ["Timestamp", "First Name", "Last Name", "Email", "Mobile", "Source"];
var NAME_PART_RE = /^[A-Za-z][A-Za-z.'\-]*$/;

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet() {
  return json({ status: "ok", service: "scd-registration" });
}

function cleanNamePart(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    var firstName = cleanNamePart(body.firstName);
    var lastName = cleanNamePart(body.lastName);

    // Backward compat: old clients sent a single combined `name`.
    if ((!firstName || !lastName) && body.name) {
      var parts = String(body.name).trim().split(/\s+/).filter(function (p) { return p; });
      if (!firstName) firstName = parts[0] || "";
      if (!lastName) lastName = parts.slice(1).join(" ");
    }

    var email = String(body.email || "").trim().toLowerCase();
    var mobile = String(body.mobile || "").replace(/\D/g, "");
    if (mobile.length === 12 && mobile.indexOf("91") === 0) {
      mobile = mobile.slice(2);
    } else if (mobile.length === 11 && mobile.charAt(0) === "0") {
      mobile = mobile.slice(1);
    }

    if (
      firstName.length < 2 ||
      !NAME_PART_RE.test(firstName) ||
      lastName.length < 1 ||
      !NAME_PART_RE.test(lastName) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
      !/^[6-9]\d{9}$/.test(mobile)
    ) {
      return json({ status: "error", message: "invalid-payload" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
    }

    // Dedupe on email (col D) or mobile (col E).
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var existing = sheet.getRange(2, 4, lastRow - 1, 2).getValues();
      for (var i = 0; i < existing.length; i++) {
        var rowEmail = String(existing[i][0] || "").trim().toLowerCase();
        var rowMobile = String(existing[i][1] || "").replace(/\D/g, "");
        if (rowEmail === email || (rowMobile !== "" && rowMobile === mobile)) {
          return json({ status: "duplicate" });
        }
      }
    }

    sheet.appendRow([
      new Date(),
      firstName,
      lastName,
      email,
      mobile,
      String(body.source || "unknown"),
    ]);
    return json({ status: "ok" });
  } catch (err) {
    return json({ status: "error", message: "server-error" });
  }
}
