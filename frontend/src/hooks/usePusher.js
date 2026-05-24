import { useEffect } from 'react'
import Pusher from 'pusher-js'
import { useQueryClient } from '@tanstack/react-query'

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || '4d232f9808abc685ed65'
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2'

const channelEvents = [
  { channel: 'leads', events: ['lead:created', 'lead:updated', 'lead:deleted', 'lead:stage_changed'], queryKey: ['leads'] },
  { channel: 'tasks', events: ['task:created', 'task:updated', 'task:deleted'], queryKey: ['tasks'] },
  { channel: 'quotations', events: ['quotation:created', 'quotation:updated', 'quotation:deleted'], queryKey: ['quotations'] },
  { channel: 'activities', events: ['activity:created'], queryKey: ['activities'] },
]

export default function usePusher() {
  const qc = useQueryClient()

  useEffect(() => {
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER })

    const subscriptions = channelEvents.map(({ channel, events, queryKey }) => {
      const ch = pusher.subscribe(channel)
      events.forEach((event) => {
        ch.bind(event, () => qc.invalidateQueries({ queryKey }))
      })
      return ch
    })

    return () => {
      subscriptions.forEach((ch) => pusher.unsubscribe(ch.name))
      pusher.disconnect()
    }
  }, [qc])
}
