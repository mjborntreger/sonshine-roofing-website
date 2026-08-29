import assert from 'node:assert/strict';
import { MAX_PUBLIC_JSON_BODY_BYTES, readBoundedJsonBody } from '../lib/http/read-json-body.ts';

function requestFromChunks(chunks, headers = {}) {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });

  return new Request('https://example.test/api', {
    method: 'POST',
    headers,
    body: stream,
    duplex: 'half',
  });
}

function requestFromSingleByteChunks(body) {
  const encoded = new TextEncoder().encode(body);
  let offset = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (offset === encoded.byteLength) {
        controller.close();
        return;
      }
      controller.enqueue(encoded.subarray(offset, offset + 1));
      offset += 1;
    },
  });

  return new Request('https://example.test/api', {
    method: 'POST',
    body: stream,
    duplex: 'half',
  });
}

assert.equal(MAX_PUBLIC_JSON_BODY_BYTES, 1024 * 1024);

const valid = await readBoundedJsonBody(
  requestFromChunks(['{"message":"', 'ordinary lead', '"}']),
  64,
);
assert.deepEqual(valid, { ok: true, value: { message: 'ordinary lead' } });

const exactLimit = await readBoundedJsonBody(requestFromChunks(['"123456"']), 8);
assert.deepEqual(exactLimit, { ok: true, value: '123456' });

const fragmentedBody = JSON.stringify('x'.repeat(4094));
const fragmentedExactLimit = await readBoundedJsonBody(
  requestFromSingleByteChunks(fragmentedBody),
  4096,
);
assert.deepEqual(fragmentedExactLimit, { ok: true, value: 'x'.repeat(4094) });

const chunkedOverflow = await readBoundedJsonBody(requestFromChunks(['"1234', '567"']), 8);
assert.deepEqual(chunkedOverflow, { ok: false, reason: 'too_large' });

const underreportedOverflow = await readBoundedJsonBody(
  requestFromChunks(['"1234567"'], { 'content-length': '2' }),
  8,
);
assert.deepEqual(underreportedOverflow, { ok: false, reason: 'too_large' });

const declaredOverflow = await readBoundedJsonBody(
  requestFromChunks(['{}'], { 'content-length': '9' }),
  8,
);
assert.deepEqual(declaredOverflow, { ok: false, reason: 'too_large' });

const invalidLengthStillStreams = await readBoundedJsonBody(
  requestFromChunks(['{}'], { 'content-length': 'invalid' }),
  8,
);
assert.deepEqual(invalidLengthStillStreams, { ok: true, value: {} });

const multibyteOverflow = await readBoundedJsonBody(requestFromChunks(['"éé"']), 5);
assert.deepEqual(multibyteOverflow, { ok: false, reason: 'too_large' });

const invalidJson = await readBoundedJsonBody(requestFromChunks(['{"message":']), 64);
assert.deepEqual(invalidJson, { ok: false, reason: 'invalid' });

const emptyBody = await readBoundedJsonBody(
  new Request('https://example.test/api', { method: 'POST' }),
  64,
);
assert.deepEqual(emptyBody, { ok: false, reason: 'invalid' });

console.log('request body limit checks passed');
