import apiClient from '../../../services/client'

export interface RecurringJobStatus {
  id: string
  cron: string
  lastJobState: string | null
  lastExecution: string | null
  nextExecution: string | null
  error: string | null
}

export const getRecurringJobs = async (signal?: AbortSignal): Promise<RecurringJobStatus[]> => {
  const response = await apiClient.get<RecurringJobStatus[]>('/api/jobs', { signal })
  return response.data
}

export const triggerTechHealthScan = async (): Promise<void> => {
  await apiClient.post('/api/jobs/tech-health-scan/trigger')
}
