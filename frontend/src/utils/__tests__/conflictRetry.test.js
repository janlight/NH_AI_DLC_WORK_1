import { describe, it, expect, vi } from 'vitest';
import { conflictRetry } from '../conflictRetry';

describe('conflictRetry', () => {
  it('성공 시 결과를 반환한다', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await conflictRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('409 에러 시 재시도한다', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce({ response: { status: 409 } })
      .mockResolvedValue('ok');

    const result = await conflictRetry(fn, { delay: 10 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('최대 재시도 초과 시 에러를 던진다', async () => {
    const err = { response: { status: 409 } };
    const fn = vi.fn().mockRejectedValue(err);

    await expect(conflictRetry(fn, { maxRetries: 1, delay: 10 })).rejects.toEqual(err);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('409가 아닌 에러는 즉시 던진다', async () => {
    const err = { response: { status: 500 } };
    const fn = vi.fn().mockRejectedValue(err);

    await expect(conflictRetry(fn)).rejects.toEqual(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
