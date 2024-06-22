// index.js
const express = require("express");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const upload = require("./multer-config");
const streamifier = require("streamifier");

const app = express();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Express route for file upload
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Check if file is present in the request
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileNameWithoutExtension = path.basename(
      req.file.originalname,
      fileExtension
    );

    // Create a readable stream from the buffer
    const stream = streamifier.createReadStream(req.file.buffer);

    // Upload file to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const cloudinaryStream = cloudinary.uploader.upload_stream(
        {
          folder: "node-express-file-upload-demo",
          public_id: req.file.mimetype.includes("image")
            ? fileNameWithoutExtension
            : req.file.originalname,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.pipe(cloudinaryStream);
    });

    // Send the Cloudinary URL in the response
    res.json({ fileUrl: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error uploading file to Cloudinary" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
