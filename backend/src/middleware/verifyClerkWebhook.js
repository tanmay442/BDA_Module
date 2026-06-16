const { Webhook } = require('svix');

/**
 * Express middleware that verifies the Svix signature on incoming
 * Clerk webhooks. Must be mounted on a route that uses
 * `express.raw({ type: 'application/json' })` - the body must NOT be
 * pre-parsed by express.json() or the signature will not match.
 *
 * On success: attaches `req.clerkEvent` (the parsed payload) and calls next().
 * On failure: returns 401 (bad signature), 410 (stale timestamp / replay
 * older than 5 minutes), or 400 (missing headers / malformed payload).
 */
function verifyClerkWebhook(req, res, next) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET is not set; rejecting webhook.');
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }

  const svixId = req.header('svix-id');
  const svixTimestamp = req.header('svix-timestamp');
  const svixSignature = req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ message: 'Missing svix headers' });
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ message: 'Webhook body must be raw bytes' });
  }

  let event;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    // WebhookVerificationError covers bad signature AND stale timestamp.
    // We differentiate by the message to give a useful status code.
    if (/timestamp/i.test(err.message)) {
      return res.status(410).json({ message: 'Stale webhook timestamp' });
    }
    return res.status(401).json({ message: 'Invalid signature' });
  }

  req.clerkEvent = event;
  next();
}

module.exports = verifyClerkWebhook;
