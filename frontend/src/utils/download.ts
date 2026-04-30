import apiClient from '../services/client'

export async function downloadExcel(endpoint: string, filename: string, params?: Record<string, unknown>): Promise<void> {
  const response = await apiClient.get(endpoint, { params, responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
