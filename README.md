# SecureTrack QR/NFC + Supabase Prototype

This prototype implements the requested flow:

1. Officer scans a QR code or taps an NFC sticker.
2. The tag opens `index.html?asset=<opaque-public-token>`.
3. SecureTrack looks up the device in Supabase and displays the device image, asset number, manufacturer, and model.
4. **Check Out Item**, **Record Inspection**, and **Report an Issue** are greyed out until **Verify Device** is selected.
5. Successful verification changes the button to green **✓ Device Verified** and enables all three actions.
6. Each action opens a separate screen and writes through a server-side Supabase/Postgres RPC.

## Files

- `index.html` — scan/tap landing page and device verification
- `checkout.html` — checkout workflow
- `inspection.html` — inspection workflow
- `issue.html` — issue reporting workflow
- `styles.css` — black/grey/orange SecureTrack design
- `common.js` — QR/NFC token handling, device lookup, Supabase client
- `schema.sql` — tables, badge hashing, RLS lockdown, and secure RPC functions
- `config.js` — Supabase project settings

## QR/NFC URL format

Host this site at a URL such as:

`https://securetrack.example.com/?asset=J7N4KQ82XP6M`

Program that complete URL into both the QR code and NFC tag assigned to that asset. Use a long random token; do not expose the serial number in the URL.

## Configure Supabase

1. Create a Supabase project.
2. Open the SQL Editor and run `schema.sql`.
3. In Supabase Project Settings > API, copy the project URL and **anon/publishable** key.
4. Edit `config.js`:

```js
window.SECURETRACK_CONFIG = {
  supabaseUrl: "https://YOURPROJECT.supabase.co",
  supabaseAnonKey: "YOUR_ANON_OR_PUBLISHABLE_KEY",
  demoMode: false
};
```

Never put a Supabase service-role key in the browser.

## Demo credentials created by schema.sql

- Employee number: `100247`
- Badge number: `842193`
- Device token: `DEMO-CEW-014`

Open:

`index.html?asset=DEMO-CEW-014`

## Device images

`devices.image_url` is displayed to the left of the verification control. For production, store approved equipment images in Supabase Storage or another controlled HTTPS location and save the image URL in the device record. If no image URL is present, SecureTrack uses `assets/device-placeholder.svg`.

## Security notes before production

This is a prototype, not a completed hospital security system. The schema deliberately prevents the public browser from selecting employee, transaction, inspection, or issue tables directly. Employee badge values are stored as password-style hashes using `pgcrypto`; credential validation occurs inside `SECURITY DEFINER` functions.

Before production deployment, add rate limiting / abuse protection, supervisor authentication and authorization, audit-log retention rules, return/transfer workflows, backup/restore, monitoring, secure image upload, privacy review, and penetration testing. If employee number and badge number are both printed on a badge, add a private PIN or another authentication factor for stronger custody verification.
