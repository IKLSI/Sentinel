import apiClient from '../../../services/client'

interface PlanQuota {
  used: number
  limit: number
}

export interface BillingStatus {
  planTier: string
  subscriptionStatus: string
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
  projects: PlanQuota
  members: PlanQuota
  scans: PlanQuota
}

export interface PlanOption {
  tier: string
  maxProjects: number
  maxMembers: number
  maxScansPerMonth: number
  priceMonthly: number
  priceAnnual: number
  isCurrent: boolean
}

export const getBillingStatus = async (signal?: AbortSignal): Promise<BillingStatus> => {
  const response = await apiClient.get<BillingStatus>('/api/billing/status', { signal })
  return response.data
}

export const getPlans = async (signal?: AbortSignal): Promise<PlanOption[]> => {
  const response = await apiClient.get<PlanOption[]>('/api/billing/plans', { signal })
  return response.data
}

export const startCheckout = async (planTier: string, billingInterval: 'monthly' | 'annual' = 'monthly'): Promise<string> => {
  const response = await apiClient.post<{ url: string }>('/api/billing/checkout', { planTier, billingInterval })
  return response.data.url
}
