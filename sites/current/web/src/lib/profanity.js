import rules from '../../../poc/backend/app/services/profanity_rules.json' with { type: 'json' };

export const PROFANITY_MESSAGE = rules.message;
const patterns = rules.patterns.map(pattern => new RegExp(pattern.normalize('NFKC'), 'iu'));

export function containsProfanity(text) {
  const normalized = text.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}\p{C}]/gu, '');
  return patterns.some(pattern => pattern.test(normalized));
}
