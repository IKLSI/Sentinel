import { useState, useCallback, useRef } from 'react'
import { Ticket, TicketFilters, PaginatedResponse } from '../../../types'
import { getTickets } from '../api/tickets'
import { useT } from '../../../i18n/I18nContext'

export const useTickets = () => {
  const t = useT()
  const [tickets, setTickets] = useState<PaginatedResponse<Ticket> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqIdRef = useRef(0)

  const fetchTickets = useCallback(async (filters: TicketFilters = {}) => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    setError(null)
    try {
      const data = await getTickets(filters)
      if (reqId === reqIdRef.current) setTickets(data)
    } catch {
      if (reqId === reqIdRef.current) setError(t('tickets.list.error_loading'))
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [t])

  return { tickets, loading, error, fetchTickets }
}
