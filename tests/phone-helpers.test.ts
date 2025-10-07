import assert from 'node:assert/strict';

import {
  sanitizePhoneInput,
  isUsPhoneComplete,
  normalizePhoneForSubmit,
  formatPhoneForDisplay,
  formatPhoneExample,
} from '../lib/phone';

(() => {
  assert.equal(sanitizePhoneInput('(941) 555-1234'), '9415551234');
  assert.equal(sanitizePhoneInput('+1 (941) 555-1234'), '19415551234');
  assert.equal(sanitizePhoneInput('1234567890123'), '12345678901');
  assert.equal(sanitizePhoneInput('2345678901234'), '2345678901');

  assert.equal(isUsPhoneComplete('9415551234'), true);
  assert.equal(isUsPhoneComplete('19415551234'), true);
  assert.equal(isUsPhoneComplete('941555123'), false);

  assert.equal(normalizePhoneForSubmit('9415551234'), '19415551234');
  assert.equal(normalizePhoneForSubmit('19415551234'), '19415551234');
  assert.equal(normalizePhoneForSubmit('+1 (941) 555-1234'), '19415551234');
  assert.equal(normalizePhoneForSubmit('555123'), '');

  assert.equal(formatPhoneForDisplay('19415551234'), '+1 (941) 555-1234');
  assert.equal(formatPhoneForDisplay('941555'), '(941) 555');
  assert.equal(formatPhoneForDisplay(''), '');

  assert.equal(formatPhoneExample(), '+1 (941) 555-1234');
})();

console.log('phone helper tests passed');
