import { defaultAdapterRegistry } from '@recoverly/adapter-contracts';
import type { AdapterDetectionResult } from '@recoverly/shared-types';

/**
 * Recoverly Content Script
 * Safety Rules:
 * - Operates only on user-approved active tab
 * - NEVER reads current-password field value
 * - Only fills fields when instructed by explicit user-approved message
 * - NEVER auto-submits the form
 * - Dispatches input and change events for reactive framework compatibility
 */

function detectPageForm(): AdapterDetectionResult {
  const currentUrl = window.location.href;
  const adapter = defaultAdapterRegistry.findAdapterForUrl(currentUrl);

  const fields = adapter.getFieldMap(document);
  const detected = fields !== null;

  // Check for MFA/CAPTCHA challenge indicators
  const mfaDetected = Boolean(
    document.querySelector('input[autocomplete="one-time-code"], input[name*="otp"], input[name*="2fa"]') ||
    document.body.innerText.includes('two-factor') ||
    document.body.innerText.includes('2-step verification')
  );

  const captchaDetected = Boolean(
    document.querySelector('.g-recaptcha, .h-captcha, iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="turnstile"]')
  );

  return {
    detected,
    fields,
    requiresAuth: !detected && document.querySelector('input[type="password"]') === null,
    mfaDetected,
    captchaDetected,
  };
}

function fillFormFields(newPassword: string): boolean {
  const currentUrl = window.location.href;
  const adapter = defaultAdapterRegistry.findAdapterForUrl(currentUrl);
  const fields = adapter.getFieldMap(document);

  if (!fields) return false;

  const newPwEl = document.querySelector<HTMLInputElement>(fields.newPasswordSelector);
  if (newPwEl) {
    newPwEl.value = newPassword;
    newPwEl.dispatchEvent(new Event('input', { bubbles: true }));
    newPwEl.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (fields.confirmPasswordSelector) {
    const confirmEl = document.querySelector<HTMLInputElement>(fields.confirmPasswordSelector);
    if (confirmEl) {
      confirmEl.value = newPassword;
      confirmEl.dispatchEvent(new Event('input', { bubbles: true }));
      confirmEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  return true;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'DETECT_PAGE_FORM') {
      const res = detectPageForm();
      sendResponse({ success: true, data: res });
      return true;
    }

    if (message.type === 'FILL_DOM_FIELDS') {
      const success = fillFormFields(message.password);
      sendResponse({ success });
      return true;
    }

    if (message.type === 'CHECK_SUCCESS_SIGNAL') {
      const adapter = defaultAdapterRegistry.findAdapterForUrl(window.location.href);
      const isSuccess = adapter.detectSuccess(document);
      sendResponse({ success: true, data: { isSuccess } });
      return true;
    }

    return false;
  });
}
