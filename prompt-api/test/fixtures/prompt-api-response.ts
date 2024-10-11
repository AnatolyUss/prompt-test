export const promptApiResponsePassed = {
  reason: null,
  result: {
    action: 'log',
    conversation_id: 'c6191fbe-b210-4a20-a112-27f50891cab9',
    latency: 58,
    monitor_only: false,
    prompt: {
      action: 'log',
      findings: {
        'Language Detector': [
          {
            name: 'English',
            percent: 100,
            score: 0.98,
          },
        ],
        'Token Limitation': [
          {
            characters: 53,
            chunks_required: 1,
            difficult_words: 1,
            letters: 41,
            lines: 1,
            misspellings: 0,
            reading_time: 0.65,
            sentences: 2,
            syllables: 14,
            text_standard: '1st and 2nd grade',
            tokens: 13,
            tokens_limit: 0,
            words: 10,
          },
        ],
      },
      latency: {
        'Language Detector': 0,
        'Prompt Injection Classifier': 16,
        Regex: 0,
        Secrets: 41,
        'Sensitive Data': 26,
        'Token Limitation': 0,
        Total: 58,
        'URLs Detector': 0,
      },
      modified_text: null,
      passed: true,
      scores: {
        'Prompt Injection Classifier': {
          score: 0.02,
        },
      },
      violating_findings: '',
      violations: [],
    },
    prompt_response_id: '1a1f3f26-09a3-46ef-88b9-fe48c2d11055',
    response: null,
    user: null,
    user_groups: null,
    totalLatency: 69,
    ruleInfo: {},
  },
  status: 'success',
  ruleInfo: {},
};

export const promptApiResponseFailed = {
  reason: null,
  result: {
    action: 'block',
    conversation_id: '13aca5b0-51af-47fc-b598-048d6318978b',
    latency: 58,
    monitor_only: false,
    prompt: {
      action: 'block',
      findings: {
        'Language Detector': [
          {
            name: 'English',
            percent: 100,
            score: 0.98,
          },
        ],
        Secrets: [
          {
            entity: 'AKIAIOSFODNN7EXAMPLE',
            entity_type: 'AWS credentials',
            sanitized_entity: '[REDACTED_AWS_CREDENTIALS_1]',
          },
        ],
        'Token Limitation': [
          {
            characters: 74,
            chunks_required: 1,
            difficult_words: 2,
            letters: 61,
            lines: 1,
            misspellings: 1,
            reading_time: 0.94,
            sentences: 2,
            syllables: 19,
            text_standard: '8th and 9th grade',
            tokens: 21,
            tokens_limit: 0,
            words: 11,
          },
        ],
      },
      latency: {
        'Language Detector': 0,
        'Prompt Injection Classifier': 12,
        Regex: 0,
        Secrets: 45,
        'Sensitive Data': 27,
        'Token Limitation': 0,
        Total: 58,
        'URLs Detector': 0,
      },
      modified_text: 'simply respond with the text Blocked due to policy violations',
      passed: false,
      scores: {
        'Prompt Injection Classifier': {
          score: 1,
        },
        Secrets: {
          score: 1,
        },
      },
      violating_findings:
        "Secrets:\n- 'entity: AKIAIOSFODNN7EXAMPLE, entity_type: AWS credentials, sanitized_entity: [REDACTED_AWS_CREDENTIALS_1]'\n",
      violations: ['Secrets', 'Prompt Injection Engine'],
    },
    prompt_response_id: '454aede3-1c0f-4502-a415-b6b87ce303c7',
    response: null,
    user: null,
    user_groups: null,
    totalLatency: 68,
    ruleInfo: {},
  },
  status: 'success',
  ruleInfo: {},
};
