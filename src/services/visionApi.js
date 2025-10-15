import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

const HF_API_URL =
  'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';

export const analyzeImage = async imageUri => {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return { success: false, error: 'No internet connection' };
    }

    // Read image as base64
    let base64Image;
    if (Platform.OS === 'android' && imageUri.startsWith('file://')) {
      base64Image = await RNFS.readFile(
        imageUri.replace('file://', ''),
        'base64',
      );
    } else {
      base64Image = await RNFS.readFile(imageUri, 'base64');
    }

    if (!base64Image) {
      throw new Error('Failed to read image file');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Updated request format
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `data:image/jpeg;base64,${base64Image}`,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('API Response:', result); // Debug log

    // Handle array of classification results
    const tags = Array.isArray(result)
      ? result
          .filter(item => item.score > 0.1) // Filter low confidence predictions
          .slice(0, 5)
          .map(item => item.label.split(',')[0].trim())
      : [];

    return { success: true, tags };
  } catch (error) {
    console.error('Image Analysis Error:', error);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timed out' };
    }
    return {
      success: false,
      error: error.message || 'Failed to analyze image',
    };
  }
};
