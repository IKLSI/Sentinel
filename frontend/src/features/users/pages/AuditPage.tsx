import React, { useEffect, useState } from 'react'
import { StatusChip } from '../../../components/StatusChip'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { getAuditLogs } from '../api/users'
import { AuditLog } from '../../../types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAuditLogs({ page })
      .then((res) => {
        setLogs(res.items ?? [])
        setHasMore((res.items?.length ?? 0) === (res.pageSize ?? 20))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  const actionVariant = (action: string): 'blue' | 'green' | 'red' | 'orange' | 'gray' => {
    if (action.includes('create')) return 'green'
    if (action.includes('delete')) return 'red'
    if (action.includes('update') || action.includes('status')) return 'orange'
    if (action.includes('send') || action.includes('pay')) return 'blue'
    return 'gray'
  }

  return (
    <>

      <Box sx={{ p: '36px 28px 24px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  {['Date', 'Utilisateur', 'Action', 'Entité', 'Détails'].map((h) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        textAlign: 'left',
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--s2)',
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {logs.map((log) => (
                  <Box
                    component="tr"
                    key={log.id}
                    sx={{ '&:hover td': { background: 'var(--s2)' } }}
                  >
                    <Box
                      component="td"
                      sx={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: 'var(--muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {log.user.firstName} {log.user.lastName}
                    </Box>
                    <Box
                      component="td"
                      sx={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}
                    >
                      <StatusChip variant={actionVariant(log.action)}>{log.action}</StatusChip>
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--cyan)',
                      }}
                    >
                      {log.entityType}: {log.entityId}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '11px',
                        color: 'var(--muted2)',
                      }}
                    >
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Précédent</Button>
              <Box component="span" sx={{ fontSize: '12px', color: 'var(--muted2)', lineHeight: '30px' }}>Page {page}</Box>
              <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Suivant →</Button>
            </Box>
          </Box>
        )}
      </Box>
    </>
  )
}
