import sanitizeHtml from 'sanitize-html';

export function cleanInput(text: string) {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function isSuspicious(text: string) {
  const t = (text ?? '').toLowerCase();
  return /(ignore.*(rules|instructions)|system:|act as|jailbreak)/.test(t);
}
