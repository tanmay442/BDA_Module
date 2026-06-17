import { useEffect } from 'react'
import Pusher from 'pusher-js'
import { useQueryClient } from '@tanstack/react-query'

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2'

/**
 * Narrow invalidation keys. Use ['resource', 'list'] for list-wide events
 * and ['resource', id] for single-row events. Drop the broad ['resource']
 * key so a single mutation doesn't refetch every variant of the query.
 */
const channelEvents = [
  {
    channel: 'leads',
    events: [
      { name: 'lead:created', queryKey: ['leads', 'list'] },
      { name: 'lead:updated', queryKey: ['leads', 'list'] },
      { name: 'lead:deleted', queryKey: ['leads', 'list'] },
      { name: 'lead:stage_changed', queryKey: ['leads', 'list'] },
    ],
  },
  {
    channel: 'tasks',
    events: [
      { name: 'task:created', queryKey: ['tasks', 'list'] },
      { name: 'task:updated', queryKey: ['tasks', 'list'] },
      { name: 'task:deleted', queryKey: ['tasks', 'list'] },
    ],
  },
  {
    channel: 'quotations',
    events: [
      { name: 'quotation:created', queryKey: ['quotations', 'list'] },
      { name: 'quotation:updated', queryKey: ['quotations', 'list'] },
      { name: 'quotation:deleted', queryKey: ['quotations', 'list'] },
    ],
  },
  {
    channel: 'activities',
    events: [
      { name: 'activity:created', queryKey: ['activities', 'list'] },
    ],
  },
]

export default function usePusher({ enabled = true } = {}) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!PUSHER_KEY || !enabled) {
      // In environments where the Pusher key isn't configured (sign-in
      // pages, preview deploys without env) we skip connecting entirely
      // rather than failing or hitting a wrong key.
      return undefined
    }

    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER })

    const subscriptions = channelEvents.map(({ channel, events }) => {
      const ch = pusher.subscribe(channel)
      events.forEach(({ name, queryKey }) => {
        ch.bind(name, () => qc.invalidateQueries({ queryKey }))
      })
      return ch
    })

    return () => {
      subscriptions.forEach((ch) => pusher.unsubscribe(ch.name))
      pusher.disconnect()
    }
  }, [qc, enabled])
}
