import imagekit from './imagekit.js';

export async function uploadImage(fileBuffer, userId) {
  if (!fileBuffer) {
    throw new Error('No file provided');
  }

  try {
    const uploadResponse = await imagekit.upload({
      file: fileBuffer,
      fileName: `profile_${userId}.jpg`, 
      folder: '/user_profiles',
      useUniqueFileName: false,
      overwriteFile: true,
      // transformationPosition: "post",
      // transformation: [{
      //   height: "300",
      //   width: "300",
      //   crop: "maintain_ratio",
      // }],
      
    });

    return uploadResponse.url;
  } catch (error) {
    console.error('ImageKit upload error:', error.message);
    throw new Error('Failed to upload profile image');
  }
}
