// Built from a string so the bundler never emits raw line-separator chars inside a regex literal.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029]', 'g');

// Removes control characters (incl. newlines) and collapses whitespace.
export function clean(value, maxLen) {
  return String(value ?? '')
    .replace(CONTROL_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-08-03" -> "03-08-2026"
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

// "17:30" -> "5:30 PM"
export function formatTime(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return '';
  const h = Number(m[1]);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

// Accepts "98201 92944", "+91-9820192944", "09820192944" -> "9820192944"
export function normalizeMobile(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function isValidMobile(raw) {
  return /^[6-9]\d{9}$/.test(normalizeMobile(raw));
}

export function isValidName(raw) {
  return /^[\p{L}][\p{L}\p{M} .'-]*$/u.test(clean(raw, 200));
}
