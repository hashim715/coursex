import { s3 } from "../config/aws_s3";

export const deleteImageByUrl = async (
  imageUrl: string,
  bucketName: string
) => {
  // Parse the URL to extract bucket name and key
  const url = new URL(imageUrl);
  const key = url.pathname.substring(1); // Extract key (removing the leading '/')

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const s3Response = await s3.deleteObject(params).promise();
    console.log("Successfully deleted image from S3", s3Response);
  } catch (error) {
    console.error("Error deleting image from S3", error);
  }
};
