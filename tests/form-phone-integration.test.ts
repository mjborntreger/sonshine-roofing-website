import assert from 'node:assert/strict';

import { parseLead } from '../lib/lead-capture/validation';

(() => {
  const contact = parseLead({
    type: 'contact-lead',
    cfToken: '1234567890',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '(941) 555-1234',
    projectType: 'repair',
    helpTopics: 'leak',
    timeline: 'soon',
    notes: 'Example lead',
    preferredContact: 'phone-call',
    bestTime: 'morning',
    consentSms: true,
    address1: '123 Main St',
    city: 'Sarasota',
    state: 'FL',
    zip: '34201',
    page: '/contact-us',
  });
  assert.equal(contact.ok, true, 'contact lead parse should succeed');
  if (contact.ok) {
    assert.equal(contact.data.phone, '19415551234');
  }

  const feedback = parseLead({
    type: 'feedback',
    cfToken: 'abcdefghij',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    phone: '941.555.1234',
    rating: 3,
    message: 'Service was great.',
    page: '/tell-us-why',
  });
  assert.equal(feedback.ok, true, 'feedback lead parse should succeed');
  if (feedback.ok) {
    assert.equal(feedback.data.phone, '19415551234');
  }

  const specialOffer = parseLead({
    type: 'special-offer',
    cfToken: 'abcdefghjk',
    firstName: 'Sara',
    lastName: 'Lee',
    email: 'sara@example.com',
    phone: '9415551234',
    offerCode: 'SPRING24',
    offerSlug: 'spring-24',
    page: '/special-offers/spring-24',
  });
  assert.equal(specialOffer.ok, true, 'special-offer parse should succeed');
  if (specialOffer.ok) {
    assert.equal(specialOffer.data.phone, '19415551234');
  }

  const financing = parseLead({
    type: 'financing-calculator',
    cfToken: 'abcdefghkl',
    firstName: 'Alex',
    lastName: 'Taylor',
    email: 'alex@example.com',
    phone: '+1 (941) 555-1234',
    address1: '456 Oak Ave',
    city: 'Bradenton',
    state: 'FL',
    zip: '34202',
    amount: 25000,
    page: '/financing',
  });
  assert.equal(financing.ok, true, 'financing parse should succeed');
  if (financing.ok) {
    assert.equal(financing.data.phone, '19415551234');
  }
})();

console.log('form phone integration tests passed');
