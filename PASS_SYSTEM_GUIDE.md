# Community Day — Registration & Pass System Guide

## For Attendees (share this)

### Get your pass (2 min)
1. Open the event page → tap **Get event pass** (or go to `/passes`).
2. Fill: full name, roll number, college mail (`@suiit.ac.in`), mobile, gender, veg/non-veg.
3. Your QR pass appears instantly with Serial No. (A01, A02…).
4. **Download the image** (`SCD_ROLLNO.png`) or **take a screenshot**. A copy is also emailed to you.
5. Lost it? Open `/passes` → **Retrieve** → enter mail, roll no, or mobile.

### Rules
- **One student = one pass.** Same mail, roll, or mobile twice = blocked.
- Pass works **one time at entry**, then invalid. Screenshot counts — keep it private.
- Only 200 passes total. When full, registration closes.
- Show QR at gate + college ID. Food counter scans the same QR for lunch.

---

## For Organizers

### Before event day
- [ ] Vercel env set: `ADMIN_PASS`, `PASS_SECRET`, `SMTP_*` (+`SMTP_FROM=awsscd@suiit.ac.in`), `UPSTASH_REDIS_REST_URL/TOKEN`, `NEXT_PUBLIC_SITE_URL`.
- [ ] Redeploy after any change. Open `/api/health` → `ok:true`, `backend` correct.
- [ ] Dashboard `/admin` → **Excel sheet** → send veg/non-veg counts to caterer.
- [ ] Dashboard → **Print gate list** (2 copies: gate + food). Offline fallback.
- [ ] Gate phones: open `/admin/scan`, login, leave on **Gate entry** mode. Food phones: switch to **Food counter** mode (sticks per phone).
- [ ] Test: register a test mail → scan → burn → check dashboard counts → delete test row if needed.

### Gate (entry)
1. Phone camera auto-starts. Point at QR — result in ~1s.
2. Green **VALID** → giant confirm button → green **DONE**, next person auto-loads.
3. Red **ALREADY USED / INVALID / EXPIRED** → block. Serial No. (`A01`) works as manual backup.
4. Network dies → paper list + pen tick, reconcile later.

### Food counter
1. Toggle to **Food counter** mode (amber).
2. Green **LUNCH VALID — serve VEG/NON-VEG** → confirm → DONE.
3. Red **LUNCH CLAIMED** → already ate. Entry status doesn't matter here.
4. Rush/queue builds → switch to printed veg/non-veg serial sheets.

### Dashboard (`/admin`)
- Cards: Registered, Entry in (+progress), Food served, Veg/Non-veg lunch, demographics, recent scans feed.
- Search any name/mail/roll/mobile/serial. Click a row for token, times, gate.
- Registration control: change cap, stop/resume registration live.
- Exports: CSV (all/entry/food/users), Excel workbook, printable gate list.

### Troubleshooting
| Symptom | Cause → Fix |
|---|---|
| `Issue failed` on Vercel | No Redis linked → add Upstash env, redeploy |
| `Registrations full` early | Check cap in Registration control; junk test rows inflate count |
| Scan shows USED on 1st scan | Camera re-read after burn (fixed: camera freezes; tap Scan next) |
| No email arrives | SMTP env missing → `/api/health` shows `mail:not-configured`; use Resend button later |
| Duplicate QR works twice | Impossible server-side (409). If seen, two different passes — check serials |
| Camera won't start | HTTP (not HTTPS) or permission denied → use manual serial entry |

### Limits
- 200 passes (env `PASS_MAX`). Passes expire after event (`PASS_EXPIRY_ISO`, default Oct 9).
- File store = local dev only. Production MUST use Upstash Redis (Vercel fs is read-only).
- Admin session 12h. Lock phones after event.
