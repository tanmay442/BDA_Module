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
    // becomes a silent no-op and emits a throttled warning.
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

// Rate-limit the warning logs to once per WINDOW_MS so a transient
// outage or rate-limit burst stays visible in production instead
// of being silenced forever after the first error. Each bucket
// is a small object so the helper can update its timestamp in
// place (primitive arguments would be passed by value).
const WINDOW_MS = 60 * 1000;
const lastMissingConfigWarn = { at: 0 };
const lastTriggerErrorWarn = { at: 0 };

function shouldLog(bucket) {
  const now = Date.now();
  if (now - bucket.at < WINDOW_MS) return false;
  bucket.at = now;
  return true;
}

function broadcast(channel, event, data) {
  const pusher = getClient();
  if (!pusher) {
    if (shouldLog(lastMissingConfigWarn)) {
      console.warn(
        '[pusher] credentials missing; real-time broadcasts disabled'
      );
    }
    return;
  }

  try {
    // pusher.trigger returns a promise; older versions were sync.
    // Both shapes are caught here.
    const result = pusher.trigger(channel, event, data);
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        if (shouldLog(lastTriggerErrorWarn)) {
          console.error(
            `[pusher] trigger failed (channel=${channel}, event=${event}):`,
            err && err.message ? err.message : err
          );
        }
      });
    }
  } catch (err) {
    if (shouldLog(lastTriggerErrorWarn)) {
      console.error(
        `[pusher] trigger threw (channel=${channel}, event=${event}):`,
        err && err.message ? err.message : err
      );
    }
  }
}

module.exports = { broadcast };
