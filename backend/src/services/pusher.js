const Pusher = require('pusher')

let pusherInstance = null;

const getPusher = () => {
  if (pusherInstance) return pusherInstance;
  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
    return null;
  }
  pusherInstance = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });
  return pusherInstance;
};

function broadcast(channel, event, data) {
  const p = getPusher();
  if (!p) {
    return Promise.resolve();
  }
  return p.trigger(channel, event, data).catch((err) => {
    console.error('Pusher broadcast failed', { channel, event, message: err.message });
  });
}

module.exports = { getPusher, broadcast }
