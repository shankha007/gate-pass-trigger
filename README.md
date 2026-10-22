# Gate Pass Request

A small mobile-first web app that sends the vendor gate pass email to the Admin team from your phone. It's front-end only: no login, no server, and nothing is stored or sent anywhere except to your own mail app.

## How it works

1. Enter the guest organization, then each visitor's name and mobile number. Tap **Add another visitor** for more.
2. Visit details are pre-filled: today's date, 10:00 AM to 5:30 PM, purpose "Meeting", meeting with Rohit Budhe. Tap **Edit** to change any of them.
3. Tap **Send to Admin**. The email opens with To, Cc, Subject and Body already filled in. Review it and tap Send.

**Which app opens (Android):** under **Open email in**, choose **Outlook** (the default) or **Default mail app**. The phone remembers your choice. On other phones, the default mail app opens.

**Table layout:** a mail link can only carry plain text, so the body that's filled in is plain text. Send also copies the email as a formatted **table**, the same layout as the original email. To use it, select all the text in the body and tap Paste.

Recipients, subject and defaults live in [`src/config.js`](src/config.js).

## Run locally

```bash
npm install
npm run dev
```

## Build & deploy (free)

```bash
npm run build
```

This produces a static `dist/` folder. To host it, drag `dist/` onto **Netlify Drop** (app.netlify.com/drop) or upload it to **Cloudflare Pages**. Both apply the security headers in `public/_headers` automatically.

Then open the URL on your phone and use **Add to Home Screen** so it opens like an app.

## Security notes

- No backend, no network calls, no cookies or storage. A strict Content-Security-Policy blocks all outbound requests and inline or third-party scripts.
- User input is stripped of control characters and newlines, length-limited and validated (names: letters only; mobile: valid Indian 10-digit). This means input can't add extra email headers (e.g. Bcc).
- All user text is HTML-escaped in the copied table. React escapes everything it renders.
- Only two runtime dependencies (`react`, `react-dom`), pinned to exact versions. `npm audit` reports 0 vulnerabilities.
