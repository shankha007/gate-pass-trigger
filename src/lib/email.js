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

export const GREETING = ['Hi Team,', 'Please provide Gate-pass for below Visitors.'];

// Table layout copied from the Admin team's template. Each row is [left, right, style]:
// 'label' = bold left cell, 'header' = both cells bold, 'value' = both cells plain, 'blank' = empty spacer.
export function tableRows(d) {
  return [
    ["Guest's organization name", d.org, 'label'],
    ['Visitor(s) Name ↓', 'Mobile Number ↓', 'header'],
    ...d.visitors.map((v) => [v.name, v.mobile, 'value']),
    ['', '', 'blank'],
    ['Visit / Meeting Time', d.time, 'label'],
    ['Meeting Date', d.date, 'label'],
    ['Purpose of his/her visit', d.purpose, 'label'],
    ['Visitor’s meeting is with (BACL Employee Name & Department)', d.meetingWith, 'label'],
  ];
}

export function buildPlainBody(d) {
  const lines = tableRows(d)
    .filter(([, , kind]) => kind !== 'blank')
    .map(([l, r, kind]) => {
      if (kind === 'header') return 'Visitor(s) Name – Mobile Number:';
      return kind === 'value' ? `${l} – ${r}` : `${l}: ${r}`;
    });
  return [GREETING[0], '', GREETING[1], '', ...lines, ''].join('\r\n');
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Rich HTML body (greeting + bordered table) for pasting into the mail app.
export function buildHtmlBody(d) {
  const font = 'font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#000';
  const cell = `border:1px solid #000;padding:10px 8px;height:20px;vertical-align:middle;${font}`;
  const td = (text, bold) =>
    `<td style="${cell}${bold ? ';font-weight:bold' : ''}">${text ? esc(text) : '&nbsp;'}</td>`;
  const rows = tableRows(d)
    .map(([l, r, kind]) => `<tr>${td(l, kind === 'label' || kind === 'header')}${td(r, kind === 'header')}</tr>`)
    .join('');
  return (
    GREETING.map((g) => `<p style="${font}">${esc(g)}</p>`).join('') +
    `<table style="border-collapse:collapse;${font}" cellpadding="0" cellspacing="0">${rows}</table><p>&nbsp;</p>`
  );
}

// When the body is going in via paste, the mailto only carries the headers.
export function buildMailto(d, { withBody = false } = {}) {
  const params = [
    // Addresses come from static config and are left unencoded: some mobile mail apps don't decode %40.
    `cc=${EMAIL.cc.join(',')}`,
    `subject=${encodeURIComponent(EMAIL.subject)}`,
    ...(withBody ? [`body=${encodeURIComponent(buildPlainBody(d))}`] : []),
  ].join('&');
  return `mailto:${EMAIL.to.join(',')}?${params}`;
}

// Returns 'rich' if the formatted table was copied, 'plain' if only text could be copied.
// The ClipboardItem is built synchronously so iOS Safari still treats it as part of the tap.
export async function copyBody(d) {
  if (window.ClipboardItem && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([buildHtmlBody(d)], { type: 'text/html' }),
          'text/plain': new Blob([buildPlainBody(d)], { type: 'text/plain' }),
        }),
      ]);
      return 'rich';
    } catch {
      // fall through to plain text
    }
  }
  await navigator.clipboard.writeText(buildPlainBody(d));
  return 'plain';
}
