/**
 * Utility function to format image URLs conditionally
 * If image starts with https, return as is
 * If image starts with /uploads, prepend base URL or use proxy in production
 * Otherwise return as is
 */
export const formatImageUrl = (imageUrl: string | null | undefined, baseUrl?: string): string | null => {
  if (!imageUrl) {
    return null;
  }

  // If image already has a full URL (starts with https or http), return as is
  if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
    return imageUrl;
  }

  // If image starts with /uploads, format URL based on environment
  if (imageUrl.startsWith('/uploads')) {
    // In production, use the proxied path through Next.js
    if (process.env.NODE_ENV === 'production') {
      return `/api${imageUrl}`;
    }
    
    // In development, use the full API URL
    const apiBaseUrl = baseUrl || process.env.API_BASE_URL || 'http://83.111.75.163:5000';
    return `${apiBaseUrl}${imageUrl}`;
  }

  // For any other case, return as is
  return imageUrl;
};

/**
 * Utility function to format multiple image URLs in an object
 */
export const formatImageUrlsInObject = (obj: any, imageFields: string[], baseUrl?: string): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const formatted = { ...obj };

  imageFields.forEach(field => {
    if (formatted[field]) {
      formatted[field] = formatImageUrl(formatted[field], baseUrl);
    }
  });

  return formatted;
};

/**
 * Utility function to format image URLs in an array of objects
 */
export const formatImageUrlsInArray = (array: any[], imageFields: string[], baseUrl?: string): any[] => {
  if (!Array.isArray(array)) {
    return array;
  }

  return array.map(item => formatImageUrlsInObject(item, imageFields, baseUrl));
};
