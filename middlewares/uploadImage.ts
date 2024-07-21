import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const mapFiles = async (files: any) => {
  const fls: Array<{}> = [];
  if (files && files?.length > 0) {
    for await (let file of files) {
      fls.push({
        name: file?.name,
        type: file?.type,
        uri: file?.uri.includes("res.cloudinary.com")
          ? file?.uri
          : await upLoadFiles(file?.uri, file?.name),
      });
    }
  }
  return fls;
};

const upLoadFiles = async (file: any, fileName?: any) => {
  const res = await cloudinary.v2.uploader.upload(file, {
    public_id: fileName,
    quality_analysis: true,
    colors: true,
  });
  return res?.secure_url;
};
