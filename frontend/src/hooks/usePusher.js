import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2'

const channelEvents = [
  {
    channel: 'leads',
    events: [
      { name: 'lead:created', invalidate: [['leads']] },
      { name: 'lead:updated', invalidate: (data) => data?.id ? [['leads'], ['leads', data.id]] : [['leads']] },
      { name: 'lead:deleted', invalidate: (data) => data?.id ? [['leads'], ['leads', data.id]] : [['leads']] },
      { name: 'lead:stage_changed', invalidate: (data) => data?.id ? [['leads'], ['leads', data.id]] : [['leads']] },
    ],
  },
  {
    channel: 'tasks',
    events: [
      { name: 'task:created', invalidate: [['tasks']] },
      { name: 'task:updated', invalidate: (data) => data?.id ? [['tasks'], ['tasks', data.id]] : [['tasks']] },
      { name: 'task:deleted', invalidate: (data) => data?.id ? [['tasks'], ['tasks', data.id]] : [['tasks']] },
    ],
  },
  {
    channel: 'quotations',
    events: [
      { name: 'quotation:created', invalidate: [['quotations']] },
      { name: 'quotation:updated', invalidate: (data) => data?.id ? [['quotations'], ['quotations', data.id]] : [['quotations']] },
      { name: 'quotation:deleted', invalidate: (data) => data?.id ? [['quotations'], ['quotations', data.id]] : [['quotations']] },
    ],
  },
  {
    channel: 'activities',
    events: [
      { name: 'activity:created', invalidate: (data) => data?.leadId ? [['activities', data.leadId]] : [['activities']] },
    ],
  },
]

const throttle = (fn, delay) => {
  let lastCall = 0
  let pendingArgs = null
  let timeout = null
  return (...args) => {
    const now = Date.now()
    const remaining = delay - (now - lastCall)
    if (remaining <= 0) {
      lastCall = now
      fn(...args)
    } else {
      pendingArgs = args
      if (!timeout) {
        timeout = setTimeout(() => {
          lastCall = Date.now()
          timeout = null
          if (pendingArgs) {
            fn(...pendingArgs)
            pendingArgs = null
          }
        }, remaining)
      }
    }
  }
}

export default function usePusher() {
  const qc = useQueryClient()
  const { isSignedIn } = useUser()
  const lastListInvalidate = useRef({})

  useEffect(() => {
    if (!isSignedIn || !PUSHER_KEY) return

    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER })

    const handleInvalidate = (invalidateSpec, data) => {
      const keys = typeof invalidateSpec === 'function' ? invalidateSpec(data) : invalidateSpec
      keys.forEach((queryKey) => {
        if (Array.isArray(queryKey[0])) {
          qc.invalidateQueries({ queryKey: queryKey[0] })
        } else {
          qc.invalidateQueries({ queryKey })
        }
      })
    }

    const throttledListInvalidate = throttle((channel) => {
      qc.invalidateQueries({ queryKey: [channel] })
    }, 1000)

    const subscriptions = channelEvents.map(({ channel, events }) => {
      const ch = pusher.subscribe(channel)
      events.forEach(({ name, invalidate }) => {
        ch.bind(name, (data) => {
          const key = `${channel}:${name}`
          if (name.endsWith(':updated') || name.endsWith(':deleted') || name.endsWith(':stage_changed')) {
            lastListInvalidate.current[key] = Date.now()
            throttledListInvalidate(channel)
          }
          handleInvalidate(invalidate, data)
        })
      })
      return ch
    })

    return () => {
      subscriptions.forEach((ch) => pusher.unsubscribe(ch.name))
      pusher.disconnect()
    }
  }, [qc, isSignedIn])
}
