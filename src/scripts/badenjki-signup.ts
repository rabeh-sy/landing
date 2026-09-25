import { badenjkiDownloads, type BadenjkiPlatform } from '~/config/badenjki-downloads';

type SessionStatus = { completed: boolean; source_code: string | null };
type Challenge = { required: boolean; challenge_id?: number; resend_available_at?: string; no_otp_token?: string };

const apiOrigin = import.meta.env.PUBLIC_BADENJKI_API_ORIGIN?.replace(/\/$/, '') || '';
const sessionKey = 'badenjki:visitor-token:v2';
const attemptKey = 'badenjki:signup-attempt:v2';
const pendingCampaignKey = 'badenjki:pending-campaign:v2';
const selectedKey = 'badenjki:selected-download:v1';

let selected: BadenjkiPlatform = 'android';
let challenge: Challenge | null = null;
let verificationToken = '';
let verified = false;
let decisionFor = '';
let busy = false;
let referralPromise: Promise<void> = Promise.resolve();
let lastPageInitialization = 0;
let effective: SessionStatus | null = null;
let decisionRevision = 0;
let fallbackSession = '';
let fallbackAttempt = '';
let opening = false;
let fallbackPending = '';

function pendingCampaign() { try { return localStorage.getItem(pendingCampaignKey) || fallbackPending; } catch { return fallbackPending; } }
function savePending(code: string) { fallbackPending = code; try { localStorage.setItem(pendingCampaignKey, code); } catch { /* memory fallback */ } }
function clearPending() { fallbackPending = ''; try { localStorage.removeItem(pendingCampaignKey); } catch { /* memory fallback */ } }

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

async function captureReferral() {
  const match = location.pathname.match(/^\/r\/([^/]+)\/?$/);
  let code = pendingCampaign();
  if (match) { try { code = decodeURIComponent(match[1]).toUpperCase(); } catch { /* invalid code */ } }
  if (code && /^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code)) {
    savePending(code);
    try {
      effective = await api('/website/session/capture', { source_code: code });
      clearPending();
    } catch { /* retry before signup */ }
  } else clearPending();
}

function platformRecommendation(): BadenjkiPlatform {
  const agent = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(agent) ? 'ios' : /Android/i.test(agent) ? 'android' : 'windows';
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

async function startDecision() {
  const country = field<HTMLInputElement>('#badenjki-country').value.trim().toUpperCase();
  const phone = field<HTMLInputElement>('#badenjki-phone').value.trim();
  if (!phone) return;
  const revision = decisionRevision;
  const next = await api('/website/otp/challenge', { country, phone });
  if (revision !== decisionRevision || `${field<HTMLSelectElement>('#badenjki-country').value}:${field<HTMLInputElement>('#badenjki-phone').value.trim()}` !== `${country}:${phone}`) return;
  challenge = next;
  decisionFor = `${country}:${phone}`;
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
  const country = field<HTMLInputElement>('#badenjki-country').value.trim().toUpperCase();
  const phone = field<HTMLInputElement>('#badenjki-phone').value.trim();
  if (decisionFor !== `${country}:${phone}`) throw new Error('ابدأ التحقق من الهاتف مجددًا.');
  const payload: Record<string, unknown> = {
    country, phone, attempt_id: attemptId(), selected_platform: selected,
  };
  if (verified) payload.verification_token = verificationToken;
  else if (challenge?.no_otp_token) payload.no_otp_token = challenge.no_otp_token;
  else throw new Error('ابدأ التحقق من الهاتف مجددًا.');
  try {
    if (pendingCampaign()) {
      await captureReferral();
      if (pendingCampaign()) throw new Error('تعذر تأكيد رابط الحملة. تحقق من اتصالك وحاول مجددًا.');
    }
    const response = await api('/website/signups', payload);
    if (!response.accepted) throw new Error('لم يكتمل التسجيل. حاول مجددًا.');
    effective = { completed: true, source_code: response.source_code };
    track('badenjki_website_signup', { source_code: response.source_code });
  } catch (error) {
    try {
      const recovered = await status();
      if (recovered.completed) {
        field<HTMLElement>('#badenjki-signup-form').hidden = true;
        field<HTMLElement>('#badenjki-success').hidden = false;
        field<HTMLAnchorElement>('#badenjki-continue').href = badenjkiDownloads[selected];
        continueDownload(selected);
        return;
      }
    } catch { /* retain original error for retry */ }
    const apiError = error as Error & { status?: number; code?: string };
    if (apiError.code === 'otp_required' || apiError.status === 401) resetDecision();
    throw error;
  }
  field<HTMLElement>('#badenjki-signup-form').hidden = true;
  field<HTMLElement>('#badenjki-success').hidden = false;
  field<HTMLAnchorElement>('#badenjki-continue').href = badenjkiDownloads[selected];
  continueDownload(selected);
}

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  clearError();
  const button = field<HTMLButtonElement>('#badenjki-submit');
  button.disabled = true;
  try {
    const key = `${field<HTMLInputElement>('#badenjki-country').value.trim().toUpperCase()}:${field<HTMLInputElement>('#badenjki-phone').value.trim()}`;
    if (decisionFor !== key) resetDecision();
    if (!challenge) await startDecision();
    else if (challenge.required && !verified) {
      const code = field<HTMLInputElement>('#badenjki-code').value.trim();
      if (!code) throw new Error('أدخل رمز التحقق.');
      const revision = decisionRevision;
      const result = await api('/website/otp/verify', { challenge_id: challenge.challenge_id, code });
      if (revision !== decisionRevision || decisionFor !== `${field<HTMLSelectElement>('#badenjki-country').value}:${field<HTMLInputElement>('#badenjki-phone').value.trim()}`) return;
      verificationToken = result.verification_token;
      verified = true;
      await submitSignup();
    } else await submitSignup();
  } catch (error) {
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
  if (Date.now() - lastPageInitialization < 500) return;
  lastPageInitialization = Date.now();
  referralPromise = captureReferral();
  if (location.pathname === '/badenjki-business' || /^\/r\/[^/]+\/?$/.test(location.pathname)) {
    void referralPromise.then(() => { if (!pendingCampaign()) recordEvent('landing_visit'); });
  }
  void status().catch(() => undefined);
  const recommended = platformRecommendation();
  document.querySelectorAll<HTMLElement>('[data-download-platform]').forEach((link) => {
    link.classList.toggle('badenjki-recommended', link.dataset.downloadPlatform === recommended);
  });
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
      if (current.completed) { continueDownload(platform); return; }
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
  if (['badenjki-phone', 'badenjki-country'].includes((event.target as HTMLElement).id)) resetDecision();
});
document.addEventListener('change', (event) => {
  if ((event.target as HTMLElement).id === 'badenjki-country') resetDecision();
});
document.addEventListener('astro:page-load', initializePage);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePage);
else initializePage();
