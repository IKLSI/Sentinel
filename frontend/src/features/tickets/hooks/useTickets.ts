import { useState, useCallback, useEffect, useRef } from 'react'
import { Ticket, TicketFilters, PaginatedResponse } from '../../../types'
import { getTickets } from '../api/tickets'
import { useT } from '../../../i18n/I18nContext'

export const useTickets = () => {
  const t = useT()
  const [tickets, setTickets] = useState<PaginatedResponse<Ticket> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqIdRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)

  const fetchTickets = useCallback(async (filters: TicketFilters = {}) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const reqId = ++reqIdRef.current
    setLoading(true)
    setError(null)
    try {
      const data = await getTickets(filters, controller.signal)
      if (reqId === reqIdRef.current) setTickets(data)
    } catch {
      if (controller.signal.aborted) return
      if (reqId === reqIdRef.current) setError(t('tickets.list.error_loading'))
    } finally {
      if (!controller.signal.aborted && reqId === reqIdRef.current) setLoading(false)
    }
  }, [t])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return { tickets, loading, error, fetchTickets }
}
