import { google } from "googleapis";

function getSheetsWriteClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, or SHEET_ID env var"
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), sheetId };
}

export async function getExistingLogSessionIds(): Promise<string[]> {
  const { sheets, sheetId } = getSheetsWriteClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Log!A:A",
  });

  const rows = response.data.values ?? [];
  return rows
    .slice(1)
    .map((row) => row[0])
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function appendLogRows(rows: string[][]): Promise<void> {
  const { sheets, sheetId } = getSheetsWriteClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Log!A:H",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });
}
