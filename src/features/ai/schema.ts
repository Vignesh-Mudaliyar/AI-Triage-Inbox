import { z } from 'zod';

export const PROMPT_VERSION = 'v1';

export const CategoryEnum = z.enum([
  'Billing',
  'Claims',
  'Endorsement',
  'General',
  'Urgent',
  'Spam',
]);

export const PriorityEnum = z.enum(['P1', 'P2', 'P3']);

export const AIResultSchema = z
  .object({
    summary_bullets: z.array(z.string().min(1)).min(2).max(4),
    category: CategoryEnum,
    priority: PriorityEnum,
    suggested_action: z.string().min(1),
    draft_reply: z.string().min(1),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type ValidatedAIResult = z.infer<typeof AIResultSchema>;
