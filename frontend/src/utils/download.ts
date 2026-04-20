import apiClient from '../services/client'

export async function downloadCsv(endpoint: string, filename: string, params?: Record<string, unknown>): Promise<void> {
  const response = await apiClient.get(endpoint, { params, responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
