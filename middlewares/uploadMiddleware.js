import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true); 
  } else {
    cb(new Error('Only .jpg and .png images are allowed'), false); // reject
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Optional: Max 5MB
});


export const uploadMedia = upload.fields([
  { name: 'images', maxCount: 10 },  // for multiple images
  { name: 'businessLogo', maxCount: 1 }  // for a single logo
]);


export default upload;
