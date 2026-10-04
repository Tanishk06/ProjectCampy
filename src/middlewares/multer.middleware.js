import multer from "multer"; //Think of Multer as the middleware that handles files coming from an HTTP request.

const storage = multer.diskStorage({
  //saves the file on your backend server's disk
  //"I want uploaded files to be stored on my server's disk."
  destination: function (req, file, cb) {
    cb(null, `./public/images`); //Multer calls my function → I decide the destination → I call cb → Multer continues.
  },
  filename: function (req, res, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1000 * 1000,
  },
});
