const PAPAGO_ENDPOINT = 'https://openapi.naver.com/v1/papago/n2mt';

export interface PapagoTranslationClientOptions {
  clientId: string;
  clientSecret: string;
  maxRetries?: number;
  initialBackoffMs?: number;
}

export class PapagoTranslationClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;

  constructor(options: PapagoTranslationClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.maxRetries = options.maxRetries ?? 3;
    this.initialBackoffMs = options.initialBackoffMs ?? 300;
  }

  async translate(text: string, source: string, target = 'ko'): Promise<string> {
    let attempt = 0;
    let waitMs = this.initialBackoffMs;

    while (attempt <= this.maxRetries) {
      const response = await fetch(PAPAGO_ENDPOINT, {
        method: 'POST',
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: new URLSearchParams({
          source,
          target,
          text,
        }),
      });

      if (response.ok) {
        const json = (await response.json()) as {
          message?: { result?: { translatedText?: string } };
        };
        const translatedText = json.message?.result?.translatedText;
        if (!translatedText) {
          throw new Error('Papago response missing translatedText');
        }
        return translatedText;
      }

      const shouldRetry = response.status === 429 || response.status >= 500;
      if (!shouldRetry || attempt === this.maxRetries) {
        const errorText = await response.text();
        throw new Error(`Papago translation failed: ${response.status} ${errorText}`);
      }

      await new Promise((resolve) => setTimeout(resolve, waitMs));
      waitMs *= 2;
      attempt += 1;
    }

    throw new Error('Papago translation failed after retries');
  }
}

export function createPapagoClientFromEnv(): PapagoTranslationClient {
  const clientId = process.env.PAPAGO_CLIENT_ID;
  const clientSecret = process.env.PAPAGO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PAPAGO_CLIENT_ID and PAPAGO_CLIENT_SECRET are required');
  }

  return new PapagoTranslationClient({ clientId, clientSecret });
}
