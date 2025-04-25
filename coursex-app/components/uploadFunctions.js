import { s3 } from "../utils/aws-sdk-config";

export const uploadImagesToS3 = async (image) => {
  if (!image) {
    return;
  }
  try {
    const response = await fetch(image.uri);
    const blob = await response.blob();

    const params = {
      Bucket: "w-groupchat-images-2",
      Key: `message-images/${Date.now()}_${image.fileName}`,
      Body: blob,
      ContentType: image.type || "image/jpeg",
    };

    const s3Response = await s3.upload(params).promise();
    return s3Response.Location;
  } catch (err) {
    return null;
  }
};

export const uploadDocumentsToS3 = async (document) => {
  if (!document) {
    return;
  }
  try {
    const response = await fetch(document.uri);
    const blob = await response.blob();

    const params = {
      Bucket: "w-groupchat-images-2",
      Key: `message-documents/${Date.now()}_${document.name}`,
      Body: blob,
      ContentType: "application/pdf",
    };

    const s3Response = await s3.upload(params).promise();
    return s3Response.Location;
  } catch (err) {
    return null;
  }
};

export const uploadVideosToS3 = async (video) => {
  if (!video) {
    return;
  }
  try {
    const response = await fetch(video.uri);
    const blob = await response.blob();

    const params = {
      Bucket: "w-groupchat-images-2",
      Key: `message-videos/${Date.now()}_${video.fileName}`,
      Body: blob,
      ContentType: video.type || "video/mp4",
    };

    const s3Response = await s3.upload(params).promise();
    // const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
    //   s3Response.Location,
    //   {
    //     time: 1000,
    //   }
    // );
    return s3Response.Location;
  } catch (err) {
    return null;
  }
};

export const uploadDocumentsToS3ForKnowledgeBase = async (document) => {
  if (!document) {
    return;
  }
  try {
    const response = await fetch(document.uri);
    const blob = await response.blob();

    const params = {
      Bucket: "w-groupchat-images-2",
      Key: `message-documents/${Date.now()}_${document.name}`,
      Body: blob,
      ContentType: "application/pdf",
    };

    const s3Response = await s3.upload(params).promise();
    return s3Response.Location;
  } catch (err) {
    return null;
  }
};
