// src/services/energyService.js
import api from './api';

class EnergyService {
  async getLatestReading(deviceId) {
    try {
      console.log(`[EnergyService] Fetching latest reading for device ${deviceId}`);
      const response = await api.get(`/energy/readings/${deviceId}/latest`);
      console.log('[EnergyService] Latest reading response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[EnergyService] Error fetching latest reading:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch latest reading');
    }
  }

  async getReadings(deviceId, period = 'daily') {
    try {
      console.log(`[EnergyService] Fetching readings for device ${deviceId}, period: ${period}`);
      const response = await api.get(`/energy/readings/${deviceId}/${period}`);
      console.log('[EnergyService] Readings response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[EnergyService] Error fetching readings:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch readings');
    }
  }

  async getStatistics(deviceId, period = 'daily') {
    try {
      console.log(`[EnergyService] Fetching statistics for device ${deviceId}, period: ${period}`);
      const response = await api.get(`/energy/statistics/${deviceId}/${period}`);
      console.log('[EnergyService] Statistics response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[EnergyService] Error fetching statistics:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }

  async getCosts(deviceId, period = 'daily') {
    try {
      console.log(`[EnergyService] Fetching costs for device ${deviceId}, period: ${period}`);
      const response = await api.get(`/energy/costs/${deviceId}/${period}`);
      console.log('[EnergyService] Costs response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[EnergyService] Error fetching costs:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch costs');
    }
  }

  async getPredictions(deviceId) {
    try {
      console.log(`[EnergyService] Fetching predictions for device ${deviceId}`);
      const response = await api.get(`/energy/predictions/${deviceId}`);
      console.log('[EnergyService] Predictions response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[EnergyService] Error fetching predictions:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch predictions');
    }
  }
}

export const energyService = new EnergyService();
export default energyService;