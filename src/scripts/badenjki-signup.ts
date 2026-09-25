import { badenjkiDownloads, type BadenjkiPlatform } from '~/config/badenjki-downloads';

type SessionStatus = { completed: boolean; source_code: string | null };
type Challenge = { required: boolean; challenge_id?: number; resend_available_at?: string; no_otp_token?: string };

const apiOrigin = import.meta.env.PUBLIC_BADENJKI_API_ORIGIN?.replace(/\/$/, '') || '';
const sessionKey = 'badenjki:visitor-token:v2';
const attemptKey = 'badenjki:signup-attempt:v2';
const pendingCampaignKey = 'badenjki:pending-campaign:v2';
const selectedKey = 'badenjki:selected-download:v1';
const dialCodes: Record<string, string> = { SY: '963', SA: '966', AE: '971', IQ: '964', JO: '962', LB: '961', TR: '90', US: '1' };

let selected: BadenjkiPlatform = 'android';
let challenge: Challenge | null = null;
let verificationToken = '';
let verified = false;
let decisionFor = '';
let busy = false;
let referralPromise: Promise<void> = Promise.resolve();
let initializedBody: HTMLElement | null = null;
let effective: SessionStatus | null = null;
let decisionRevision = 0;
let fallbackSession = '';
let fallbackAttempt = '';
let opening = false;
let fallbackPending: string[] = [];

function pendingCampaigns(): string[] {
  let raw = '';
  try {
    raw = localStorage.getItem(pendingCampaignKey) || '';
    if (!raw) return fallbackPending;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === 'string') : [raw];
  } catch { return raw ? [raw] : fallbackPending; }
}
function savePending(codes: string[]) {
  fallbackPending = codes;
  try { localStorage.setItem(pendingCampaignKey, JSON.stringify(codes)); } catch { /* memory fallback */ }
}
function queueCampaign(code: string) {
  const codes = pendingCampaigns();
  if (!codes.includes(code)) savePending([...codes, code]);
}

function asciiDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0)));
}

function normalizedPhone(country: string, input: string): string {
  const dial = dialCodes[country];
  if (!dial) throw new Error('اختر بلدًا من القائمة.');
  const value = asciiDigits(input.trim());
  if (!value) throw new Error('أدخل رقم الهاتف.');
  if (!/^\+?[\d\s().-]+$/.test(value) || (value.match(/\+/g) || []).length > 1)
    throw new Error('استخدم أرقامًا ومسافات أو شرطات فقط في رقم الهاتف.');
  const digits = value.replace(/\D/g, '');
  const international = value.startsWith('+') || digits.startsWith('00');
  let national = digits.startsWith('00') ? digits.slice(2) : digits;
  if (international && !national.startsWith(dial))
    throw new Error('رمز البلد في الرقم لا يطابق البلد المحدد.');
  if (national.startsWith(dial) && (country !== 'SY' || international || national.length !== 9))
    national = national.slice(dial.length);
  national = national.replace(/^0/, '');
  if (country === 'SY' && national.length !== 9)
    throw new Error('يجب أن يتكون الرقم السوري من ٩ أرقام بعد حذف الصفر ورمز البلد.');
  if (country !== 'SY' && (dial.length + national.length < 7 || dial.length + national.length > 15))
    throw new Error('تحقق من طول رقم الهاتف.');
  return `${dial}${national}`;
}

function sessionId(): string {
  try {
    let id = localStorage.getItem(sessionKey);
    if (!id || !/^[0-9a-f]{64}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(sessionKey, id);
    }
    return id;
  } catch {
    fallbackSession ||= Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
    return fallbackSession;
  }
}

function attemptId(): string {
  try {
    let id = localStorage.getItem(attemptKey);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(attemptKey, id); }
    return id;
  } catch { fallbackAttempt ||= crypto.randomUUID(); return fallbackAttempt; }
}

async function status(): Promise<SessionStatus> {
  effective = await api('/website/session');
  if (!effective!.completed) {
    try { localStorage.removeItem(attemptKey); } catch { fallbackAttempt = ''; }
  }
  return effective!;
}

function recordEvent(kind: 'landing_visit' | 'download_intent', platform?: BadenjkiPlatform) {
  void api('/website/session/event', { kind, platform, event_id: crypto.randomUUID() }).catch(() => undefined);
}

function track(event: string, details: Record<string, string> = {}) {
  const layer = (window as Window & { dataLayer?: Record<string, string>[] }).dataLayer;
  layer?.push({ event, ...details });
}

async function api(path: string, body?: Record<string, unknown>) {
  const localApi = import.meta.env.DEV && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(apiOrigin);
  if (!apiOrigin || (!/^https:\/\//.test(apiOrigin) && !localApi)) throw new Error('خدمة التسجيل غير مهيأة حاليًا. حاول لاحقًا.');
  const response = await fetch(`${apiOrigin}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'X-Website-Session': sessionId(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'omit',
  }).catch(() => { throw new Error('تعذر الاتصال بالخدمة. تحقق من اتصالك وحاول مجددًا.'); });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'تعذر الاتصال بالخدمة. حاول مجددًا.') as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

function landingPage() { return /^\/badenjki-business\/?$/.test(location.pathname); }

async function captureReferral() {
  const url = new URL(location.href);
  const fromLanding = landingPage() && url.searchParams.has('ref');
  const incoming = fromLanding ? (url.searchParams.get('ref') || '').trim().toUpperCase() : '';
  if (incoming && /^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(incoming)) queueCampaign(incoming);
  let handled = !incoming || !/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(incoming);
  for (const code of pendingCampaigns()) {
    try {
      const result = await api('/website/session/capture', { source_code: code }) as SessionStatus & { captured: boolean };
      effective = result;
      savePending(pendingCampaigns().filter(item => item !== code));
      if (code === incoming) handled = true;
    } catch { break; }
  }
  if (fromLanding && handled && location.pathname === url.pathname && new URL(location.href).searchParams.get('ref') === url.searchParams.get('ref')) {
    url.searchParams.delete('ref');
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}

function dialog(): HTMLDialogElement | null { return document.querySelector('#badenjki-signup'); }
function field<T extends HTMLElement>(selector: string): T { return document.querySelector<T>(selector)!; }
function showError(message: string) {
  const element = field<HTMLElement>('#badenjki-signup-error');
  element.textContent = message;
  element.hidden = false;
}
function clearError() { field<HTMLElement>('#badenjki-signup-error').hidden = true; }
function resetDecision() {
  decisionRevision++;
  challenge = null;
  verificationToken = '';
  verified = false;
  decisionFor = '';
  field<HTMLElement>('#badenjki-code-field').hidden = true;
  field<HTMLInputElement>('#badenjki-code').value = '';
  field<HTMLElement>('#badenjki-resend').hidden = true;
  field<HTMLButtonElement>('#badenjki-submit').textContent = 'متابعة';
}

function phoneFields() {
  const country = field<HTMLSelectElement>('#badenjki-country').value;
  const phone = normalizedPhone(country, field<HTMLInputElement>('#badenjki-phone').value);
  return { country, phone, key: `${country}:${phone}` };
}

function currentDecision(key: string, revision: number) {
  if (revision !== decisionRevision) return false;
  try { return phoneFields().key === key; } catch { return false; }
}

function updatePrefix() {
  const country = field<HTMLSelectElement>('#badenjki-country').value;
  field<HTMLElement>('#badenjki-prefix').textContent = `+${dialCodes[country] || ''}`;
}

function continueDownload(platform: BadenjkiPlatform) {
  window.open(badenjkiDownloads[platform], '_blank', 'noopener,noreferrer');
}

function openSignup(platform: BadenjkiPlatform) {
  selected = platform;
  try { sessionStorage.setItem(selectedKey, platform); } catch { /* optional convenience */ }
  const modal = dialog();
  if (!modal) return;
  resetDecision();
  clearError();
  field<HTMLElement>('#badenjki-signup-form').hidden = false;
  field<HTMLElement>('#badenjki-success').hidden = true;
  modal.showModal();
}

function showSuccess(platform: BadenjkiPlatform) {
  selected = platform;
  try { sessionStorage.setItem(selectedKey, platform); } catch { /* optional convenience */ }
  field<HTMLElement>('#badenjki-signup-form').hidden = true;
  field<HTMLElement>('#badenjki-success').hidden = false;
  field<HTMLAnchorElement>('#badenjki-continue').href = badenjkiDownloads[platform];
  const modal = dialog();
  if (modal && !modal.open) modal.showModal();
  continueDownload(platform);
}

async function startDecision() {
  const { country, phone, key } = phoneFields();
  const revision = decisionRevision;
  const next = await api('/website/otp/challenge', { country, phone });
  if (!currentDecision(key, revision)) return;
  challenge = next;
  decisionFor = key;
  if (challenge!.required) {
    field<HTMLElement>('#badenjki-code-field').hidden = false;
    field<HTMLElement>('#badenjki-resend').hidden = false;
    field<HTMLButtonElement>('#badenjki-submit').textContent = 'تحقق من الرمز';
    field<HTMLInputElement>('#badenjki-code').focus();
  } else {
    await submitSignup();
  }
}

async function submitSignup() {
  const { country, phone, key } = phoneFields();
  const revision = decisionRevision;
  if (decisionFor !== key) throw new Error('ابدأ التحقق من الهاتف مجددًا.');
  const payload: Record<string, unknown> = {
    country, phone, attempt_id: attemptId(), selected_platform: selected,
  };
  if (verified) payload.verification_token = verificationToken;
  else if (challenge?.no_otp_token) payload.no_otp_token = challenge.no_otp_token;
  else throw new Error('ابدأ التحقق من الهاتف مجددًا.');
  try {
    if (pendingCampaigns().length) {
      await captureReferral();
      if (pendingCampaigns().length) throw new Error('تعذر تأكيد رابط الحملة. تحقق من اتصالك وحاول مجددًا.');
    }
    if (!currentDecision(key, revision)) return;
    const response = await api('/website/signups', payload);
    if (!currentDecision(key, revision)) return;
    if (!response.accepted) throw new Error('لم يكتمل التسجيل. حاول مجددًا.');
    effective = { completed: true, source_code: response.source_code };
    track('badenjki_website_signup', { source_code: response.source_code });
  } catch (error) {
    try {
      const recovered = await status();
      if (recovered.completed && currentDecision(key, revision)) {
        showSuccess(selected);
        return;
      }
    } catch { /* retain original error for retry */ }
    const apiError = error as Error & { status?: number; code?: string };
    if (!currentDecision(key, revision)) return;
    if (apiError.code === 'otp_required' || apiError.status === 401) resetDecision();
    throw error;
  }
  showSuccess(selected);
}

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  clearError();
  let submittedRevision = decisionRevision;
  const button = field<HTMLButtonElement>('#badenjki-submit');
  button.disabled = true;
  try {
    const key = phoneFields().key;
    if (decisionFor !== key) resetDecision();
    submittedRevision = decisionRevision;
    if (!challenge) await startDecision();
    else if (challenge.required && !verified) {
      const code = asciiDigits(field<HTMLInputElement>('#badenjki-code').value.trim());
      if (!code) throw new Error('أدخل رمز التحقق.');
      const revision = decisionRevision;
      const result = await api('/website/otp/verify', { challenge_id: challenge.challenge_id, code });
      if (!currentDecision(key, revision) || decisionFor !== key) return;
      verificationToken = result.verification_token;
      verified = true;
      await submitSignup();
    } else await submitSignup();
  } catch (error) {
    if (submittedRevision === decisionRevision)
      showError(error instanceof Error ? error.message : 'تعذر إكمال التسجيل. حاول مجددًا.');
  } finally { busy = false; button.disabled = false; }
}

function initializePage() {
  const form = document.querySelector<HTMLFormElement>('#badenjki-signup-form');
  if (form && !form.dataset.signupBound) {
    form.dataset.signupBound = 'true';
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void handleSubmit(event);
    });
  }
  if (initializedBody === document.body) return;
  initializedBody = document.body;
  updatePrefix();
  referralPromise = captureReferral();
  if (landingPage()) {
    const pageBody = document.body;
    void referralPromise.then(() => { if (document.body === pageBody && !pendingCampaigns().length) recordEvent('landing_visit'); });
  }
  void status().catch(() => undefined);
  let saved: string | null = null;
  try { saved = sessionStorage.getItem(selectedKey); } catch { /* optional convenience */ }
  if (saved && saved in badenjkiDownloads) selected = saved as BadenjkiPlatform;
}

document.addEventListener('click', async (event) => {
  const link = (event.target as HTMLElement).closest<HTMLElement>('[data-download-platform]');
  if (link) {
    event.preventDefault();
    if (opening) return;
    opening = true;
    const platform = link.dataset.downloadPlatform as BadenjkiPlatform;
    try {
      if (!(platform in badenjkiDownloads)) return;
      await referralPromise;
      recordEvent('download_intent', platform);
      const current = await status();
      if (current.completed) { showSuccess(platform); return; }
      openSignup(platform);
    } catch (error) {
      openSignup(platform);
      showError(error instanceof Error ? error.message : 'تعذر التحقق من حالة التسجيل.');
    } finally { opening = false; }
    return;
  }
  if ((event.target as HTMLElement).closest('[data-signup-close]')) dialog()?.close();
  if ((event.target as HTMLElement).closest('#badenjki-resend')) {
    event.preventDefault();
    if (busy) return;
    const retryAt = challenge?.resend_available_at ? Date.parse(challenge.resend_available_at) : 0;
    if (Date.now() < retryAt) return showError('انتظر قليلًا قبل إعادة إرسال الرمز.');
    busy = true;
    resetDecision();
    try { await startDecision(); clearError(); } catch (error) { showError(error instanceof Error ? error.message : 'تعذر إرسال الرمز.'); }
    finally { busy = false; }
  }
});

document.addEventListener('input', (event) => {
  if ((event.target as HTMLElement).id === 'badenjki-phone') { resetDecision(); clearError(); }
});
document.addEventListener('change', (event) => {
  if ((event.target as HTMLElement).id === 'badenjki-country') { updatePrefix(); resetDecision(); clearError(); }
});
document.addEventListener('astro:page-load', initializePage);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePage);
else initializePage();
