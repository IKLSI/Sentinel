import { useState, useCallback } from 'react'
import { Ticket, TicketFilters, PaginatedResponse } from '../../../types'
import { getTickets } from '../api/tickets'

export const useTickets = () => {
  const [tickets, setTickets] = useState<PaginatedResponse<Ticket> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async (filters: TicketFilters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTickets(filters)
      setTickets(data)
    } catch {
      setError('Erreur lors du chargement des tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  return { tickets, loading, error, fetchTickets }
}
