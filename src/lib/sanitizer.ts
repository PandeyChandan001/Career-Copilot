export interface RedactedCounts {
  emails: number;
  phones: number;
  urls: number;
}

export interface SanitizeResumeResult {
  cleanText: string;
  redactedCounts: RedactedCounts;
}

// Strict email regex matching standard email addresses
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// URL regex matching web links, protocols, and social/portfolio domains with paths
const URL_REGEX = /(?:(?:https?:\/\/|ftps?:\/\/|www\.)[^\s<>"'(),]+[^\s<>"'(),.:;!?])|(?:\b(?:[a-zA-Z0-9-]+\.)*(?:linkedin\.com|github\.com|gitlab\.com|twitter\.com|x\.com|medium\.com|dev\.to|behance\.net|dribbble\.com|vercel\.app|netlify\.app)\/[^\s<>"'(),]+[^\s<>"'(),.:;!?])/gi;

// Phone regex matching:
// 1. Standard formatted numbers: +1 (555) 123-4567, 555-123-4567, (555) 123-4567, 555.123.4567
// 2. International numbers: +91 98765 43210, +44 20 7123 4567, +91-9876543210
// 3. Raw 10-digit mobile numbers: e.g. 9876543210, 5551234567 (excluding round numbers starting with 0/1)
const PHONE_REGEX = /(?:(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b)|(?:\+\d{1,3}[-.\s]?(?:\(?\d{1,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}\b)|(?:\b[2-9]\d{9}\b)/g;

/**
 * Sanitizes candidate resume text by stripping Personally Identifiable Information (PII)
 * such as email addresses, phone numbers, and portfolio/social profile links.
 * 
 * @param text Raw candidate resume text
 * @returns Cleaned text with sensitive data replaced with redaction placeholders and counts
 */
export function sanitizeResumeText(text: string): SanitizeResumeResult {
  if (!text || typeof text !== 'string') {
    return {
      cleanText: '',
      redactedCounts: { emails: 0, phones: 0, urls: 0 },
    };
  }

  let cleanText = text;

  // 1. URLs & Social Links (Run first to avoid partial email/phone matches inside URLs)
  const urlMatches = cleanText.match(URL_REGEX);
  const urlsCount = urlMatches ? urlMatches.length : 0;
  if (urlsCount > 0) {
    cleanText = cleanText.replace(URL_REGEX, '[REDACTED_LINK]');
  }

  // 2. Email Addresses
  const emailMatches = cleanText.match(EMAIL_REGEX);
  const emailsCount = emailMatches ? emailMatches.length : 0;
  if (emailsCount > 0) {
    cleanText = cleanText.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');
  }

  // 3. Phone Numbers
  const phoneMatches = cleanText.match(PHONE_REGEX);
  const phonesCount = phoneMatches ? phoneMatches.length : 0;
  if (phonesCount > 0) {
    cleanText = cleanText.replace(PHONE_REGEX, '[REDACTED_PHONE]');
  }

  return {
    cleanText,
    redactedCounts: {
      emails: emailsCount,
      phones: phonesCount,
      urls: urlsCount,
    },
  };
}
