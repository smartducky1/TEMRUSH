# TEMRUSH — GitHub + Vercel + Google Sheets + Apps Script

1. Create a Google Sheet.
2. Extensions -> Apps Script -> paste `apps-script/Code.gs`.
3. Apps Script Project Settings -> Script properties:
   - `SHEET_ID` = your Sheet ID
   - `ADMIN_KEY` = your private admin password
4. Deploy Apps Script as Web app, Execute as Me, access Anyone. Copy the `/exec` URL.
5. Put that URL in BOTH `script.js` and `admin/index.html`, replacing `PASTE_YOUR_APPS_SCRIPT_URL_HERE`.
6. Upload the TEMRUSH folder contents to GitHub.
7. Import the repo into Vercel.

Routes:
- `/` = public TEMRUSH site
- `/admin` = admin dashboard
