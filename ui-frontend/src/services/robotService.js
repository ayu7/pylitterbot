import axios from 'axios'

const API_BASE_URL = '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const robotService = {
  getRobots: async () => {
    const response = await apiClient.get('/robots')
    return response.data.robots
  },

  getRobotStatus: async (robotId) => {
    const response = await apiClient.get(`/robots/${robotId}/status`)
    return response.data
  },

  getRobotActivities: async (robotId, limit = 20) => {
    const response = await apiClient.get(`/robots/${robotId}/activities?limit=${limit}`)
    return response.data.activities
  },

  controlRobot: async (robotId, action, value = null) => {
    const response = await apiClient.post(`/robots/${robotId}/control`, {
      action,
      value,
    })
    return response.data
  },

  resetDrawer: async (robotId) => {
    const response = await apiClient.post(`/robots/${robotId}/reset-drawer`)
    return response.data
  },

  healthCheck: async () => {
    const response = await apiClient.get('/health')
    return response.data
  },
}
