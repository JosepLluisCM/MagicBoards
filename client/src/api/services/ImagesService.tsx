import apiClient from "../apiClient";
/**
 * Uploads an image to the server
 * @param imageFile File object to upload
 * @param request Additional parameters for the upload
 * @returns Path to the uploaded image
 */
export async function uploadImage(imageFile: File, id?: string) {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("image", imageFile);

    if (id) {
      formData.append("canvasId", id);
    }

    // Send the image to the server
    const response = await apiClient.post("images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.imagePath;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Fetches an image by path and returns an object URL
 * @param imagePath Path to the image
 * @returns Object URL for the image
 */
export async function getImage(imagePath: string) {
  try {
    const response = await apiClient.get(
      `images/${encodeURIComponent(imagePath)}`,
      {
        responseType: "blob",
      }
    );
    return URL.createObjectURL(response.data);
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Gets a pre-signed URL for an image
 * @param imagePath Path to the image
 * @returns Pre-signed URL
 */
export async function getImagePresignedUrl(imagePath: string) {
  try {
    const response = await apiClient.get(
      `images/presigned/${encodeURIComponent(imagePath)}`
    );
    return response.data.url;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}

/**
 * Deletes an image from the server
 * @param imagePath Path to the image to delete
 * @returns Server response
 */
export async function deleteImage(imagePath: string) {
  try {
    const response = await apiClient.delete(
      `images/${encodeURIComponent(imagePath)}`
    );
    return response.data;
  } catch (error) {
    // API client already handles error categorization and logging
    throw error;
  }
}
