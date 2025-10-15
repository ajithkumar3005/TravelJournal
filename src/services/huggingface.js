import axios from 'axios';

const HUGGING_FACE_API_KEY = 'YOUR_HUGGINGFACE_API_KEY';
const MODEL_URL =
  'https://api-inference.huggingface.co/models/google/vit-base-patch16-224';

export const getImageTags = async imageBase64 => {
  try {
    const response = await axios.post(
      MODEL_URL,
      { inputs: imageBase64 },
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data?.slice(0, 5).map(item => item.label) || [];
  } catch (error) {
    console.log('Hugging Face Error:', error.message);
    return [];
  }
};
