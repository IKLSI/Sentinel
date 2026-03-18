import apiClient from '../../../services/client'

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid'

export interface InvoiceDto {
  id: string
  reference: string
  label: string
  techProjectId?: string
  techProjectName?: string
  dailyRate: number
  period: string
  totalHours: number
  totalAmount: number
  taxRate: number
  taxAmount: number
  totalWithTax: number
  status: InvoiceStatus
  issuedAt: string
  dueAt?: string
  paidAt?: string
  hasPdf: boolean
  isOverdue: boolean
}

export interface GenerateInvoiceDto {
  organizationId: string
  techProjectId?: string
  label: string
  dailyRate: number
  period: string
  taxRate?: number
  dueDays?: number
}

export const getInvoices = async (params?: { status?: string; period?: string }): Promise<InvoiceDto[]> => {
  const response = await apiClient.get<InvoiceDto[]>('/api/invoices', { params })
  return response.data
}

export const getInvoice = async (id: string): Promise<InvoiceDto> => {
  const response = await apiClient.get<InvoiceDto>(`/api/invoices/${id}`)
  return response.data
}

export const generateInvoice = async (data: GenerateInvoiceDto): Promise<InvoiceDto> => {
  const response = await apiClient.post<InvoiceDto>('/api/invoices/generate', data)
  return response.data
}

export const updateInvoiceStatus = async (id: string, status: InvoiceStatus): Promise<InvoiceDto> => {
  const response = await apiClient.patch<InvoiceDto>(`/api/invoices/${id}/status`, { status })
  return response.data
}

export const deleteInvoice = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/invoices/${id}`)
}

export const downloadInvoicePdf = async (id: string, filename: string): Promise<void> => {
  const response = await apiClient.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export const openInvoicePdf = async (id: string): Promise<void> => {
  const response = await apiClient.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  window.open(url, '_blank')
}
