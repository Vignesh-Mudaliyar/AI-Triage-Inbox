import type { Category, InboxItem, Priority } from '../../types';
import { AIAbortError, AINetworkError, AIValidationError } from './errors';
import { AIResultSchema, type ValidatedAIResult } from './schema';

export type AIHeader = Omit<ValidatedAIResult, 'draft_reply'>;

export type AIEvent =
  | { type: 'start'; header: AIHeader; raw: string }
  | { type: 'chunk'; delta: string }
  | { type: 'done'; result: ValidatedAIResult; raw: string };

const FAILURE_RATE = 0.12;
const BAD_JSON_RATE = 0.08;

export interface RunMockAIOptions {
  signal?: AbortSignal;
  forceFailure?: 'none' | 'network' | 'invalid';
}

/**
 * Mock AI generation.
 *
 * The *output* is a pure function of the item (same item → same category,
 * summary, draft, confidence). The *simulation noise* (latency, which calls
 * fail) uses Math.random on purpose — if failures were deterministic per
 * item, retrying would always fail the same items and users could never
 * recover from a transient error.
 */
export async function* runMockAI(
  item: InboxItem,
  { signal, forceFailure = 'none' }: RunMockAIOptions = {}
): AsyncGenerator<AIEvent, void, unknown> {
  // Simulated network latency: 200–1200 ms.
  await sleep(200 + Math.random() * 1000, signal);

  // Occasional network-style failure.
  if (forceFailure === 'network' || (forceFailure === 'none' && Math.random() < FAILURE_RATE)) {
    throw new AINetworkError(pickNetworkError());
  }

  // Build the deterministic result from the item.
  const result = generateResult(item);

  // Occasionally return a schema-invalid version to exercise Zod validation.
  const candidate =
    forceFailure === 'invalid' || (forceFailure === 'none' && Math.random() < BAD_JSON_RATE)
      ? corrupt(result)
      : result;

  const raw = JSON.stringify(candidate, null, 2);
  const parsed = AIResultSchema.safeParse(candidate);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`
    );
    throw new AIValidationError('AI output failed schema validation', raw, issues);
  }

  const validated = parsed.data;
  const { draft_reply, ...header } = validated;

  // Yield the structured header (everything except the draft).
  yield { type: 'start', header, raw };

  // Stream the draft one token at a time so the UI feels like a real LLM.
  // split(/(\s+)/) keeps whitespace as its own tokens, so spacing is preserved.
  for (const token of draft_reply.split(/(\s+)/).filter(Boolean)) {
    if (signal?.aborted) throw new AIAbortError();
    await sleep(20 + Math.random() * 40, signal);
    yield { type: 'chunk', delta: token };
  }

  yield { type: 'done', result: validated, raw };
}

// AbortSignal-aware setTimeout. Resolves after `ms`, or rejects immediately
// if the signal is aborted before then.
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AIAbortError());
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new AIAbortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

const NETWORK_ERRORS = [
  'Provider timed out after 8s',
  'Upstream 503 — please retry',
  'Connection reset',
  'Rate limit exceeded',
];

function pickNetworkError(): string {
  return NETWORK_ERRORS[Math.floor(Math.random() * NETWORK_ERRORS.length)];
}

// ---------------------------------------------------------------------------
// Deterministic content — pure functions of the item.
// ---------------------------------------------------------------------------

const SPAM_DOMAIN_RE = /\.(biz|shop|click|top|loan)$/i;
const PROMPT_INJECTION_RE =
  /\b(ignore (?:previous|all) instructions|send (?:your|me) (?:internal )?(?:access )?token|click here|verify (?:your )?account)\b/i;

// Confidence is part of the AI output, so it must be deterministic per item.
// Tying it to category keeps the value stable on retry and reflects a
// realistic property of classifiers — they tend to be more confident about
// clear-cut categories like spam, less so for general enquiries.
const CONFIDENCE_BY_CATEGORY: Record<Category, number> = {
  Spam: 0.94,
  Claims: 0.89,
  Endorsement: 0.86,
  Billing: 0.83,
  Urgent: 0.8,
  General: 0.72,
};

function generateResult(item: InboxItem): ValidatedAIResult {
  const category = classify(item);
  return {
    summary_bullets: summarize(item, category),
    category,
    priority: suggestPriority(item, category),
    suggested_action: suggestAction(category, item),
    draft_reply: draftReply(item, category),
    confidence: CONFIDENCE_BY_CATEGORY[category],
  };
}

function classify(item: InboxItem): Category {
  const blob = `${item.subject}\n${item.body}`.toLowerCase();
  const tags = item.tags.map((t) => t.toLowerCase());

  if (
    tags.includes('spam') ||
    tags.includes('phishing') ||
    PROMPT_INJECTION_RE.test(item.body) ||
    SPAM_DOMAIN_RE.test(item.sender.email)
  ) {
    return 'Spam';
  }
  if (tags.includes('claim') || /\b(claim|accident|stolen|theft|flood|hospitalised|hospitalized|rejected)\b/i.test(blob)) {
    return 'Claims';
  }
  if (
    tags.includes('endorsement') ||
    /\b(endorsement|update (?:my )?address|change (?:plate|address|name)|additional driver|beneficiary|typo)\b/i.test(blob)
  ) {
    return 'Endorsement';
  }
  if (
    tags.includes('billing') ||
    tags.includes('refund') ||
    /\b(premium|invoice|refund|installment|payment|due (?:date|in)|withholding|bill)\b/i.test(blob)
  ) {
    return 'Billing';
  }
  if (item.priority === 'P1') return 'Urgent';
  return 'General';
}

function suggestPriority(item: InboxItem, cat: Category): Priority {
  if (cat === 'Spam') return 'P3';
  if (cat === 'Claims') {
    if (/\b(accident|stolen|theft|flood|pre-?auth(?:orization)?|hospitalised|hospitalized|rejected|dispute)\b/i.test(item.body))
      return 'P1';
    return 'P2';
  }
  if (cat === 'Urgent') return 'P1';
  if (cat === 'Billing' && /\b(refund|not arrived|pending|cleared)\b/i.test(item.body)) return 'P2';
  return 'P3';
}

function summarize(item: InboxItem, cat: Category): string[] {
  const bullets: string[] = [];
  const policy = item.body.match(/ID-[A-Z]{3}-\d+/);
  const amount = item.body.match(/Rp\s?[\d.,]+/);
  const claimRef = item.body.match(/CLM-\d+/);

  bullets.push(`${cat} request via ${item.channel} from ${item.sender.name}.`);

  if (cat === 'Claims') {
    if (/accident/i.test(item.body)) bullets.push('Reports a vehicle accident; needs surveyor or workshop dispatch.');
    else if (/flood/i.test(item.body)) bullets.push('Property flooded; reports damage to furniture/electronics.');
    else if (/stolen|theft/i.test(item.body)) bullets.push('Total-loss claim — vehicle reported stolen with police report.');
    else if (/pre-?auth|hospitalised|hospitalized/i.test(item.body)) bullets.push('Hospital is awaiting pre-authorization to proceed with care.');
    else if (/rejected|denied|do not agree/i.test(item.body)) bullets.push('Customer disputes a denied claim and may escalate to OJK.');
    else bullets.push('Claim submitted; awaiting status / next steps from us.');
  } else if (cat === 'Billing') {
    if (/higher|increased|rose|increase/i.test(item.body)) bullets.push('Renewal premium rose unexpectedly; customer wants explanation.');
    else if (/refund|not arrived/i.test(item.body)) bullets.push('Promised refund has not arrived past the stated SLA.');
    else if (/pending|cleared/i.test(item.body)) bullets.push('Payment cleared at bank but portal still shows pending.');
    else if (/installment/i.test(item.body)) bullets.push('Customer asks about installment payment options.');
    else bullets.push('Billing-related request; needs finance/CS clarification.');
  } else if (cat === 'Endorsement') {
    bullets.push('Endorsement request — policy details need updating.');
  } else if (cat === 'Spam') {
    bullets.push('Likely phishing / prompt-injection attempt; do NOT engage.');
  } else if (cat === 'Urgent') {
    bullets.push('Flagged P1 — needs immediate triage by senior agent.');
  } else {
    bullets.push('General enquiry; can be handled in standard SLA window.');
  }

  if (policy) bullets.push(`Policy referenced: ${policy[0]}.`);
  if (claimRef) bullets.push(`Claim reference: ${claimRef[0]}.`);
  if (amount && bullets.length < 4) bullets.push(`Amount mentioned: ${amount[0]}.`);

  return bullets.slice(0, 4);
}

function suggestAction(cat: Category, item: InboxItem): string {
  switch (cat) {
    case 'Claims':
      if (/accident/i.test(item.body))
        return 'Acknowledge within 30 min, dispatch surveyor or direct to nearest partner workshop.';
      if (/pre-?auth|hospitalised|hospitalized/i.test(item.body))
        return 'Approve pre-auth call with hospital within 1 hour; loop in medical advisor.';
      if (/stolen|theft/i.test(item.body))
        return 'Open total-loss case; request police report, BPKB, STNK, and signed cession.';
      if (/flood/i.test(item.body))
        return 'Confirm flood coverage on policy, request photos and contractor estimate.';
      if (/rejected|denied|do not agree/i.test(item.body))
        return 'Escalate to claims review committee; respond within 24h to avoid OJK escalation.';
      return 'Pull claim status from system and reply with current stage + ETA.';
    case 'Billing':
      if (/refund/i.test(item.body))
        return 'Confirm refund batch with finance; reply with bank trace ref by EOD.';
      if (/pending/i.test(item.body))
        return 'Manually reconcile VA payment with receipt; clear pending status today.';
      return 'Reply with itemized billing explanation and offer call slot if needed.';
    case 'Endorsement':
      return 'Validate documents on file; process endorsement and send updated e-policy.';
    case 'Spam':
      return 'Quarantine and report to security@qoala.com. Do not reply or click links.';
    case 'Urgent':
      return 'Route to senior agent immediately; acknowledge within 15 minutes.';
    case 'General':
    default:
      return 'Reply with the relevant info from the knowledge base; close within SLA.';
  }
}

function draftReply(item: InboxItem, cat: Category): string {
  const name = item.sender.name.split(' ')[0] || 'there';

  if (cat === 'Spam') {
    return `This message has been flagged as suspicious and will not receive a substantive reply. If you reached us in error, please contact Qoala through our official channels at www.qoala.com.\n\nKind regards,\nQoala Team`;
  }

  return [
    `Hi ${name},`,
    '',
    openingForCategory(cat),
    bodyForCategory(item, cat),
    'Thanks for your patience while we work on this.',
    '',
    'Best,',
    'The Qoala Team',
  ].join('\n');
}

function openingForCategory(cat: Category): string {
  switch (cat) {
    case 'Claims':
      return 'Thanks for reaching out about your claim. We have your initial details and are starting the process now.';
    case 'Billing':
      return 'Thanks for flagging this billing question — we are checking with finance directly.';
    case 'Endorsement':
      return 'Thanks for the endorsement request. We will validate your documents and process this shortly.';
    case 'Urgent':
      return 'Your message has been flagged as high-priority and a senior agent is taking it now.';
    default:
      return 'Thanks for reaching out to Qoala — happy to help.';
  }
}

function bodyForCategory(item: InboxItem, cat: Category): string {
  const policy = item.body.match(/ID-[A-Z]{3}-\d+/)?.[0];
  if (cat === 'Claims') {
    return `To move this forward, please have the following ready: damage photos, incident location, and your policy number${policy ? ` (${policy})` : ''}. A surveyor will reach out within the next 2 hours.`;
  }
  if (cat === 'Billing') {
    return 'We will send a detailed breakdown and current status within the next business day.';
  }
  if (cat === 'Endorsement') {
    return `An updated e-policy${policy ? ` for ${policy}` : ''} will follow once validation completes (1–2 working days).`;
  }
  if (cat === 'Urgent') {
    return 'Please stay on this thread — you will hear back from us within 15 minutes.';
  }
  return 'We will get back to you with a full answer within one business day.';
}

// Deliberately break the result in one of four ways so Zod validation has
// something to catch — different break per call exercises different schema
// rules over time.
function corrupt(result: ValidatedAIResult): unknown {
  switch (Math.floor(Math.random() * 4)) {
    case 0:
      return { ...result, category: 'Refund' }; // invalid enum value
    case 1:
      return { ...result, summary_bullets: [] }; // below min(2)
    case 2: {
      const { confidence: _c, ...rest } = result; // missing required field
      return rest;
    }
    default:
      return { ...result, confidence: 1.5 }; // out of [0, 1] range
  }
}
