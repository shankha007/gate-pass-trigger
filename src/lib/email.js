import { EMAIL, LIMITS } from '../config.js';
import { clean, formatDate, formatTime, normalizeMobile } from './format.js';

// Turns raw form state into the cleaned values that go into the email.
export function toEmailData(form) {
  return {
    org: clean(form.org, LIMITS.org),
    visitors: form.visitors.map((v) => ({
      name: clean(v.name, LIMITS.name),
      mobile: normalizeMobile(v.mobile),
    })),
    time: `${formatTime(form.timeFrom)} to ${formatTime(form.timeTo)}`,
    date: formatDate(form.date),
    purpose: clean(form.purpose, LIMITS.text),
    meetingWith: clean(form.meetingWith, LIMITS.text),
  };
}

function rows(d) {
  return [
    ["Guest's organization name", d.org],
    ['Visit / Meeting Time', d.time],
    ['Meeting Date', d.date],
    ['Purpose of his/her visit', d.purpose],
    ['Visitor’s meeting is with (BACL Employee Name & Department)', d.meetingWith],
  ];
}

export function buildPlainBody(d) {
  const [org, ...rest] = rows(d);
  const visitorLines = d.visitors.map(
    (v, i) => `${d.visitors.length > 1 ? `${i + 1}. ` : ''}${v.name} – ${v.mobile}`,
  );
  return [
    'Hi Team,',
    '',
    'Please provide Gate-pass for below Visitors.',
    '',
    `${org[0]}: ${org[1]}`,
    '',
    'Visitor(s) Name – Mobile Number:',
    ...visitorLines,
    '',
    ...rest.map(([k, v]) => `${k}: ${v}`),
    '',
  ].join('\r\n');
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// HTML version (table) for pasting into mail apps that keep rich formatting.
export function buildHtmlBody(d) {
  const td = 'style="border:1px solid #999;padding:6px 10px;vertical-align:top"';
  const th = 'style="border:1px solid #999;padding:6px 10px;background:#f2f2f2;text-align:left;vertical-align:top"';
  const [org, ...rest] = rows(d);
  const visitorRows = d.visitors
    .map((v) => `<tr><td ${td}>${esc(v.name)}</td><td ${td}>${esc(v.mobile)}</td></tr>`)
    .join('');
  return (
    '<p>Hi Team,</p><p>Please provide Gate-pass for below Visitors.</p>' +
    '<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:14px">' +
    `<tr><th ${th}>${esc(org[0])}</th><td ${td}>${esc(org[1])}</td></tr>` +
    `<tr><th ${th}>Visitor(s) Name</th><th ${th}>Mobile Number</th></tr>` +
    visitorRows +
    rest.map(([k, v]) => `<tr><th ${th}>${esc(k)}</th><td ${td}>${esc(v)}</td></tr>`).join('') +
    '</table>'
  );
}

// Addresses come from static config and are left unencoded: some mobile mail apps don't decode %40.
// Everything user-entered lives only in the encoded body.
export function buildMailto(d) {
  const params = [
    `cc=${EMAIL.cc.join(',')}`,
    `subject=${encodeURIComponent(EMAIL.subject)}`,
    `body=${encodeURIComponent(buildPlainBody(d))}`,
  ].join('&');
  return `mailto:${EMAIL.to.join(',')}?${params}`;
}

export async function copyRich(d) {
  const html = buildHtmlBody(d);
  const text = buildPlainBody(d);
  if (window.ClipboardItem && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      return;
    } catch {
      // fall through to plain text
    }
  }
  await navigator.clipboard.writeText(text);
}
