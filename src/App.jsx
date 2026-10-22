import { useMemo, useRef, useState } from 'react';
import { DEFAULTS, EMAIL, LIMITS } from './config.js';
import { buildMailto, buildPlainBody, copyRich, toEmailData } from './lib/email.js';
import { formatDate, formatTime, isValidMobile, isValidName, todayISO } from './lib/format.js';

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  chevron: 'm6 9 6 6 6-6',
  check: 'M20 6 9 17l-5-5',
};

function initialForm() {
  return {
    org: DEFAULTS.org,
    visitors: [{ id: 1, name: DEFAULTS.visitorName, mobile: '' }],
    date: todayISO(),
    timeFrom: DEFAULTS.timeFrom,
    timeTo: DEFAULTS.timeTo,
    purpose: DEFAULTS.purpose,
    meetingWith: DEFAULTS.meetingWith,
  };
}

function validate(f) {
  const e = {};
  if (!f.org.trim()) e.org = 'Enter the guest organization';
  f.visitors.forEach((v) => {
    if (!v.name.trim()) e[`name-${v.id}`] = 'Enter visitor name';
    else if (!isValidName(v.name)) e[`name-${v.id}`] = 'Use letters only';
    if (!v.mobile.trim()) e[`mobile-${v.id}`] = 'Enter mobile number';
    else if (!isValidMobile(v.mobile)) e[`mobile-${v.id}`] = 'Enter a valid 10-digit mobile';
  });
  if (!f.date) e.date = 'Pick a date';
  if (!f.timeFrom || !f.timeTo) e.time = 'Pick both times';
  else if (f.timeTo <= f.timeFrom) e.time = 'End time must be after start time';
  if (!f.purpose.trim()) e.purpose = 'Enter purpose';
  if (!f.meetingWith.trim()) e.meetingWith = 'Enter employee name';
  return e;
}

// Prefilled defaults are usually replaced, so select them on tap to make overtyping easy.
const selectAll = (e) => e.target.select();

function Field({ label, error, children, htmlFor }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [editDetails, setEditDetails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState('');
  const [sent, setSent] = useState(false);
  const nextId = useRef(2);
  const toastTimer = useRef();

  const errors = useMemo(() => validate(form), [form]);
  const data = useMemo(() => toEmailData(form), [form]);
  const err = (key) => (submitted || touched[key] ? errors[key] : undefined);
  const touch = (key) => () => setTouched((t) => ({ ...t, [key]: true }));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const setVisitor = (id, key) => (e) => {
    // Mobile: allow only digits, spaces, + and - while typing.
    const value = key === 'mobile' ? e.target.value.replace(/[^\d+\s-]/g, '') : e.target.value;
    setForm((f) => ({
      ...f,
      visitors: f.visitors.map((v) => (v.id === id ? { ...v, [key]: value } : v)),
    }));
  };

  const addVisitor = () => {
    if (form.visitors.length >= LIMITS.maxVisitors) return;
    const id = nextId.current++;
    setForm((f) => ({ ...f, visitors: [...f.visitors, { id, name: '', mobile: '' }] }));
    requestAnimationFrame(() => document.getElementById(`name-${id}`)?.focus());
  };

  const removeVisitor = (id) =>
    setForm((f) => ({ ...f, visitors: f.visitors.filter((v) => v.id !== id) }));

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  const ensureValid = () => {
    setSubmitted(true);
    const keys = Object.keys(errors);
    if (keys.length === 0) return true;
    if (['date', 'time', 'purpose', 'meetingWith'].some((k) => keys.includes(k))) setEditDetails(true);
    requestAnimationFrame(() => {
      const first = document.querySelector('.has-error input');
      first?.focus();
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    showToast('Please fix the highlighted fields');
    return false;
  };

  const handleSend = () => {
    if (!ensureValid()) return;
    window.location.href = buildMailto(data);
    setSent(true);
  };

  const handleCopy = async () => {
    if (!ensureValid()) return;
    try {
      await copyRich(data);
      showToast('Copied — paste into your email body');
    } catch {
      showToast('Copy failed on this browser');
    }
  };

  const reset = () => {
    setForm(initialForm());
    setTouched({});
    setSubmitted(false);
    setEditDetails(false);
    setShowPreview(false);
    setSent(false);
    nextId.current = 2;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isToday = form.date === todayISO();
  const detailsHaveError = ['date', 'time', 'purpose', 'meetingWith'].some((k) => err(k));

  if (sent) {
    return (
      <main className="app">
        <section className="card done">
          <div className="done-icon"><Icon d={ICONS.check} size={32} /></div>
          <h1>Mail app opened</h1>
          <p className="muted">
            Everything is filled in for <strong>{data.org}</strong> ({data.visitors.length}{' '}
            visitor{data.visitors.length > 1 ? 's' : ''}). Just review and tap <strong>Send</strong>.
          </p>
          <button className="btn primary block" onClick={reset}>
            <Icon d={ICONS.plus} /> New gate pass request
          </button>
          <button className="btn ghost block" onClick={() => setSent(false)}>
            Back to this request
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="app">
        <header className="top">
          <h1>Gate Pass Request</h1>
          <p className="muted">Fill visitor details and send to Admin in one tap.</p>
        </header>

        <section className="card">
          <h2>Guest organization</h2>
          <Field label="Organization name" htmlFor="org" error={err('org')}>
            <input id="org" type="text" placeholder="e.g. Saasworx" autoComplete="organization"
              maxLength={LIMITS.org} value={form.org} onChange={set('org')} onBlur={touch('org')}
              onFocus={selectAll} />
          </Field>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Visitors</h2>
            <span className="badge">{form.visitors.length}</span>
          </div>
          {form.visitors.map((v, i) => (
            <div className="visitor" key={v.id}>
              <div className="visitor-head">
                <span className="visitor-num">Visitor {i + 1}</span>
                {form.visitors.length > 1 && (
                  <button className="icon-btn danger" onClick={() => removeVisitor(v.id)}
                    aria-label={`Remove visitor ${i + 1}`}>
                    <Icon d={ICONS.trash} size={18} />
                  </button>
                )}
              </div>
              <Field label="Full name" htmlFor={`name-${v.id}`} error={err(`name-${v.id}`)}>
                <input id={`name-${v.id}`} type="text" placeholder="e.g. Digvijay Malik"
                  autoComplete="off" autoCapitalize="words" maxLength={LIMITS.name}
                  value={v.name} onChange={setVisitor(v.id, 'name')} onBlur={touch(`name-${v.id}`)}
                  onFocus={selectAll} />
              </Field>
              <Field label="Mobile number" htmlFor={`mobile-${v.id}`} error={err(`mobile-${v.id}`)}>
                <input id={`mobile-${v.id}`} type="tel" inputMode="tel" placeholder="10-digit mobile"
                  autoComplete="off" maxLength={16}
                  value={v.mobile} onChange={setVisitor(v.id, 'mobile')} onBlur={touch(`mobile-${v.id}`)} />
              </Field>
            </div>
          ))}
          {form.visitors.length < LIMITS.maxVisitors && (
            <button className="btn outline block" onClick={addVisitor}>
              <Icon d={ICONS.plus} /> Add another visitor
            </button>
          )}
        </section>

        <section className={`card${detailsHaveError ? ' card-error' : ''}`}>
          <div className="card-head">
            <h2>Visit details</h2>
            <button className="link-btn" onClick={() => setEditDetails((x) => !x)}
              aria-expanded={editDetails}>
              {editDetails ? 'Done' : <><Icon d={ICONS.edit} size={16} /> Edit</>}
            </button>
          </div>

          {!editDetails ? (
            <dl className="summary">
              <div><dt>Date</dt><dd>{formatDate(form.date)}{isToday && <span className="chip">Today</span>}</dd></div>
              <div><dt>Time</dt><dd>{formatTime(form.timeFrom)} – {formatTime(form.timeTo)}</dd></div>
              <div><dt>Purpose</dt><dd>{form.purpose || '—'}</dd></div>
              <div><dt>Meeting with</dt><dd>{form.meetingWith || '—'}</dd></div>
            </dl>
          ) : (
            <>
              <Field label="Meeting date" htmlFor="date" error={err('date')}>
                <input id="date" type="date" value={form.date} onChange={set('date')} onBlur={touch('date')} />
              </Field>
              <Field label="Visit / meeting time" error={err('time')}>
                <div className="row">
                  <input aria-label="From time" type="time" value={form.timeFrom}
                    onChange={set('timeFrom')} onBlur={touch('time')} />
                  <span className="muted">to</span>
                  <input aria-label="To time" type="time" value={form.timeTo}
                    onChange={set('timeTo')} onBlur={touch('time')} />
                </div>
              </Field>
              <Field label="Purpose of visit" htmlFor="purpose" error={err('purpose')}>
                <input id="purpose" type="text" maxLength={LIMITS.text} value={form.purpose}
                  onChange={set('purpose')} onBlur={touch('purpose')} />
              </Field>
              <Field label="Meeting with (BACL employee & department)" htmlFor="meetingWith"
                error={err('meetingWith')}>
                <input id="meetingWith" type="text" maxLength={LIMITS.text} value={form.meetingWith}
                  onChange={set('meetingWith')} onBlur={touch('meetingWith')} />
              </Field>
            </>
          )}
        </section>

        <section className="card">
          <button className="collapse-btn" onClick={() => setShowPreview((x) => !x)}
            aria-expanded={showPreview}>
            <h2>Email preview</h2>
            <span className={`chev${showPreview ? ' open' : ''}`}><Icon d={ICONS.chevron} /></span>
          </button>
          {showPreview && (
            <div className="preview">
              <p><span className="muted">To:</span> {EMAIL.to.join(', ')}</p>
              <p><span className="muted">Cc:</span> {EMAIL.cc.join(', ')}</p>
              <p><span className="muted">Subject:</span> {EMAIL.subject}</p>
              <pre>{buildPlainBody(data)}</pre>
            </div>
          )}
        </section>
      </main>

      <div className="action-bar">
        <button className="btn secondary" onClick={handleCopy} aria-label="Copy email as table">
          <Icon d={ICONS.copy} />
        </button>
        <button className="btn primary grow" onClick={handleSend}>
          <Icon d={ICONS.send} /> Send to Admin
        </button>
      </div>

      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
