/**
 * Image caching utility to improve performance by storing image data in memory
 * and avoiding unnecessary network requests
 */

// In-memory cache for images
const imageCache: Record<string, string> = {};

/**
 * Stores an image in the cache with a given key
 * @param key - Unique identifier for the image (e.g., user ID)
 * @param imageData - The image data (usually a base64 string)
 */
export const cacheImage = (key: string, imageData: string): void => {
  imageCache[key] = imageData;
};

/**
 * Retrieves an image from the cache
 * @param key - The unique identifier for the image
 * @returns The cached image data or null if not found
 */
export const getCachedImage = (key: string): string | null => {
  return imageCache[key] || null;
};

/**
 * Formats a base64 image string to ensure it has the correct prefix
 * @param base64Image - Base64 string that may or may not have the correct prefix
 * @returns Properly formatted base64 image string
 */
export const formatBase64Image = (base64Image: string): string => {
  let formattedImage = base64Image;

  // Remove redundant prefixes if they exist
  if (formattedImage.includes('dataimage/jpegbase64')) {
    formattedImage = formattedImage.replace('dataimage/jpegbase64', '');
  }

  // Add the correct prefix if missing
  if (!formattedImage.startsWith('data:image/jpeg;base64,')) {
    formattedImage = `data:image/jpeg;base64,${formattedImage}`;
  }

  return formattedImage;
};

/**
 * Clears the image cache
 * Use this when you want to force a refresh of all images
 */
export const clearImageCache = (): void => {
  Object.keys(imageCache).forEach((key) => {
    delete imageCache[key];
  });
};
