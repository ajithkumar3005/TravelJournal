import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { getEntries, updateDataEntry } from '../db/dbconfiguration';
import { analyzeImage } from './visionApi';

const API_URL = 'YOUR_API_ENDPOINT';
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

class NetworkService {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      if (wasOffline && this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  async syncOfflineData() {
    try {
      const entries = await getEntries();
      const offlineEntries = entries.filter(entry => entry.isOffline);

      for (const entry of offlineEntries) {
        // Try to analyze images if they exist
        if (entry.photos) {
          const photos = JSON.parse(entry.photos);
          const tags = [];

          for (const photo of photos) {
            const result = await analyzeImage(photo);
            if (result.success) {
              tags.push(...result.tags);
            }
          }

          // Update entry with tags
          if (tags.length > 0) {
            const updatedEntry = {
              ...entry,
              tags: JSON.stringify([...new Set(tags)]),
              isOffline: false,
            };

            // Sync with server
            await this.syncEntryWithServer(updatedEntry);

            // Update local DB
            await updateDataEntry(entry.id, updatedEntry);
          }
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  async syncEntryWithServer(entry) {
    try {
      if (!this.isOnline) {
        this.syncQueue.push(entry);
        return { success: false, error: 'Offline' };
      }

      const response = await axiosInstance.post('/entries', entry);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('API sync error:', error);
      return { success: false, error: error.message };
    }
  }

  isNetworkConnected() {
    return this.isOnline;
  }
}

export const networkService = new NetworkService();
