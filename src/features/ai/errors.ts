export class AINetworkError extends Error {
  constructor(message = 'AI provider unreachable') {
    super(message);
    this.name = 'AINetworkError';
  }
}

export class AIValidationError extends Error {
  readonly raw: string;
  readonly issues: string[];
  constructor(message: string, raw: string, issues: string[]) {
    super(message);
    this.name = 'AIValidationError';
    this.raw = raw;
    this.issues = issues;
  }
}

export class AIAbortError extends Error {
  constructor() {
    super('AI generation cancelled');
    this.name = 'AIAbortError';
  }
}
