import apiClient from '../../../services/client'

export const getDashboardStats = async () => {
  const response = await apiClient.get('/api/dashboard/stats')
  return response.data
}
