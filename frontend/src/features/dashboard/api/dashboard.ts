import apiClient from "../../../services/client";

export const getDashboardStats = async (signal?: AbortSignal) => {
  const response = await apiClient.get("/api/dashboard/stats", { signal });
  return response.data;
};
