export const MAX_PUBLIC_JSON_BODY_BYTES = 1024 * 1024;

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: 'invalid' | 'too_large' };

function declaredBodyTooLarge(request: Request, maxBytes: number): boolean {
  const raw = request.headers.get('content-length')?.trim();
  if (!raw || !/^\d+$/.test(raw)) return false;

  const declaredBytes = Number(raw);
  return !Number.isSafeInteger(declaredBytes) || declaredBytes > maxBytes;
}

export async function readBoundedJsonBody(
  request: Request,
  maxBytes = MAX_PUBLIC_JSON_BODY_BYTES,
): Promise<JsonBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError('maxBytes must be a positive safe integer.');
  }

  if (declaredBodyTooLarge(request, maxBytes)) {
    return { ok: false, reason: 'too_large' };
  }

  if (!request.body) {
    return { ok: false, reason: 'invalid' };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = new Uint8Array(Math.min(maxBytes, 8192));
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: 'too_large' };
      }

      if (receivedBytes > bytes.byteLength) {
        let nextCapacity = bytes.byteLength;
        while (nextCapacity < receivedBytes) {
          nextCapacity = Math.min(maxBytes, Math.max(nextCapacity * 2, receivedBytes));
        }

        const grown = new Uint8Array(nextCapacity);
        grown.set(bytes);
        bytes = grown;
      }

      bytes.set(value, receivedBytes - value.byteLength);
    }

    return {
      ok: true,
      value: JSON.parse(decoder.decode(bytes.subarray(0, receivedBytes))) as unknown,
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  } finally {
    reader.releaseLock();
  }
}
