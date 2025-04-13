import { useState } from 'react';

export const useImageUpload = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImage = async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      // Here you would typically upload to your server
      // For now, we'll just create a local URL
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      
      return imageUrl;
    } catch (err) {
      setError('Failed to upload image');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { image, loading, error, uploadImage };
}; 