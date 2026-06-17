const { broadcast } = require('../../src/services/pusher');

describe('pusher service', () => {
  // The module-level bucket timestamps persist across tests, so we
  // exercise the throttling behavior directly.

  beforeEach(() => {
    // Ensure Pusher is not configured so broadcast() takes the
    // missing-config branch.
    delete process.env.PUSHER_APP_ID;
    delete process.env.PUSHER_KEY;
    delete process.env.PUSHER_SECRET;
    delete process.env.PUSHER_CLUSTER;
  });

  it('throttles the missing-config warning (does not log on every call)', () => {
    let warns = 0;
    const orig = console.warn;
    console.warn = () => { warns++; };
    try {
      for (let i = 0; i < 5; i++) broadcast('ch', 'ev', {});
    } finally {
      console.warn = orig;
    }
    // Once-only booleans would have produced 1 warning; the new
    // time-windowed helper also produces 1 within the 60s window,
    // so we additionally assert that a flood of 100 calls does not
    // produce 100 warnings.
    expect(warns).toBe(1);

    let bigFlood = 0;
    console.warn = () => { bigFlood++; };
    try {
      for (let i = 0; i < 100; i++) broadcast('ch', 'ev', {});
    } finally {
      console.warn = orig;
    }
    expect(bigFlood).toBe(0);
  });
});
