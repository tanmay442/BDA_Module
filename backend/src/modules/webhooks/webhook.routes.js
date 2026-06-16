const express = require('express');
const verifyClerkWebhook = require('../../middleware/verifyClerkWebhook');
const User = require('../users/user.model');
const { promoteIfBootstrapEmail } = require('../../services/bootstrap');

const router = express.Router();

/**
 * POST /api/webhooks/clerk
 *
 * Handles user lifecycle events from Clerk. MUST be mounted in app.js
 * with `express.raw({ type: 'application/json' })` BEFORE the global
 * `express.json()` middleware, otherwise the Svix signature won't match.
 *
 * Events handled:
 *   - user.created       -> upsert User row (default role: bda, then
 *                           promoteIfBootstrapEmail may upgrade to admin)
 *   - user.updated       -> refresh email/name/image; never touch role
 *                           (role changes go through PATCH /api/users/:id/role
 *                           by an admin, NOT through Clerk metadata)
 *   - user.deleted       -> hard delete the User row (Clerk is the source
 *                           of truth for identity)
 *
 * Idempotency: the upsert uses `clerkId` as the dedupe key. Svix may retry
 * deliveries; a second create is a no-op, a second update refreshes the
 * same row, and a second delete is a no-op (handled gracefully).
 */
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  verifyClerkWebhook,
  async (req, res) => {
    const event = req.clerkEvent;
    const eventType = event.type;

    try {
      switch (eventType) {
        case 'user.created':
        case 'user.updated': {
          const { id, email_addresses, first_name, last_name, image_url } = event.data;
          if (!id) {
            return res.status(400).json({ message: 'Missing user id' });
          }

          const primary = (email_addresses || []).find((e) => e.id === event.data.primary_email_address_id)
            || (email_addresses || [])[0];
          const email = primary?.email_address?.toLowerCase() || null;
          const name = [first_name, last_name].filter(Boolean).join(' ').trim() || email || 'Unnamed';

          const update = {
            $set: { email, name, imageUrl: image_url || null },
            $setOnInsert: { clerkId: id, role: 'bda' },
          };

          const user = await User.findOneAndUpdate({ clerkId: id }, update, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          });

          // First-admin bootstrap: if the DB has no admin yet and this
          // user's email is in BOOTSTRAP_ADMIN_EMAILS, promote them.
          await promoteIfBootstrapEmail(user);

          return res.status(200).json({ received: true });
        }

        case 'user.deleted': {
          const { id } = event.data;
          if (!id) {
            return res.status(400).json({ message: 'Missing user id' });
          }
          // Idempotent delete: silently swallow "not found" so retries
          // from Svix don't pollute logs.
          await User.deleteOne({ clerkId: id });
          return res.status(200).json({ received: true });
        }

        default:
          // Acknowledge unknown event types so Svix stops retrying.
          return res.status(200).json({ received: true, ignored: eventType });
      }
    } catch (err) {
      console.error('Webhook handler error:', err);
      // 5xx -> Svix will retry. Acceptable because the upsert is
      // idempotent on the next attempt.
      return res.status(500).json({ message: 'Internal error' });
    }
  }
);

module.exports = router;
