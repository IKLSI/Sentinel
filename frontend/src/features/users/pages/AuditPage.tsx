import React, { useEffect, useState } from 'react'
import { Topbar } from '../../../layouts/Topbar'
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
      <Topbar title="Audit log" subtitle="Historique des actions" />
      <Box sx={{ p: '24px 28px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <CircularProgress />
          </div>
        ) : (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Utilisateur', 'Action', 'Entité', 'Détails'].map((h) => (
                    <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--s2)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onMouseEnter={(e) => Array.from(e.currentTarget.cells).forEach((c) => (c.style.background = 'var(--s2)'))}
                    onMouseLeave={(e) => Array.from(e.currentTarget.cells).forEach((c) => (c.style.background = 'transparent'))}
                  >
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 600 }}>
                      {log.user.firstName} {log.user.lastName}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                      <StatusChip variant={actionVariant(log.action)}>{log.action}</StatusChip>
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan)' }}>
                      {log.entityType}: {log.entityId}
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted2)' }}>
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Précédent</Button>
              <span style={{ fontSize: '12px', color: 'var(--muted2)', lineHeight: '30px' }}>Page {page}</span>
              <Button variant="outlined" size="small" sx={{ textTransform: 'none' }} disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>Suivant →</Button>
            </div>
          </div>
        )}
      </Box>
    </>
  )
}
