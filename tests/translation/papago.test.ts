import { PapagoTranslationClient } from '@/services/translation/papago';

describe('PapagoTranslationClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns translated text on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { result: { translatedText: '안녕하세요' } } }),
    }) as unknown as typeof fetch;

    const client = new PapagoTranslationClient({
      clientId: 'id',
      clientSecret: 'secret',
    });

    const translated = await client.translate('hello', 'en', 'ko');
    expect(translated).toBe('안녕하세요');
  });

  it('retries on 429 then succeeds', async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'rate limited',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { result: { translatedText: '재시도 성공' } } }),
      });

    global.fetch = mockFetch as unknown as typeof fetch;

    const client = new PapagoTranslationClient({
      clientId: 'id',
      clientSecret: 'secret',
      maxRetries: 2,
      initialBackoffMs: 1,
    });

    const translated = await client.translate('retry', 'en', 'ko');
    expect(translated).toBe('재시도 성공');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
