import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const mapFiles = async (files: any[]) => {
  const fls: Array<{}> = [];
  if (files && files.length > 0) {
    files.map(async (f: any) => {
      fls.push({
        name: f.name,
        type: f.type,
        uri: f.uri.includes("res.cloudinary.com")
          ? f.uri
          : await upLoadFiles(f.uri, f.name),
      });
    });
  }

  return fls;
};

const upLoadFiles = async (file: any, fileName?: any) => {
  const uri = await cloudinary.v2.uploader.upload(file, {
    public_id: fileName,
  });

  return uri?.secure_url;
};
