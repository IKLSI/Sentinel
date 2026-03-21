import { useState, useCallback, useRef } from 'react'
import { Ticket, TicketFilters, PaginatedResponse } from '../../../types'
import { getTickets } from '../api/tickets'

export const useTickets = () => {
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
      if (reqId === reqIdRef.current) setError('Erreur lors du chargement des tickets')
    } finally {
      if (reqId === reqIdRef.current) setLoading(false)
    }
  }, [])

  return { tickets, loading, error, fetchTickets }
}
