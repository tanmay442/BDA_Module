/**
 * Real-time fanout via Pusher.
 *
 * The Pusher SDK is called from request controllers AFTER the DB write
 * has succeeded. If Pusher is down, throws, or its credentials are
 * misconfigured, the API MUST still return a successful response —
 * the user's write is persisted; real-time is a best-effort side
 * effect. Wrap trigger() in a try/catch and log (don't throw) on
 * failure.
 */

const Pusher = require('pusher');

let client = null;

function getClient() {
  if (client) return client;

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    // Don't instantiate a client that will immediately fail. broadcast()
    // will be a silent no-op and we'll log once.
    return null;
  }

  client = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return client;
}

let warnedMissingConfig = false;
let warnedTriggerError = false;

function broadcast(channel, event, data) {
  const pusher = getClient();
  if (!pusher) {
    if (!warnedMissingConfig) {
      console.warn(
        '[pusher] credentials missing; real-time broadcasts disabled'
      );
      warnedMissingConfig = true;
    }
    return;
  }

  try {
    // pusher.trigger returns a promise; older versions were sync.
    // Both shapes are caught here.
    const result = pusher.trigger(channel, event, data);
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        if (!warnedTriggerError) {
          console.error(
            `[pusher] trigger failed (channel=${channel}, event=${event}):`,
            err && err.message ? err.message : err
          );
          warnedTriggerError = true;
        }
      });
    }
  } catch (err) {
    if (!warnedTriggerError) {
      console.error(
        `[pusher] trigger threw (channel=${channel}, event=${event}):`,
        err && err.message ? err.message : err
      );
      warnedTriggerError = true;
    }
  }
}

module.exports = { broadcast };
