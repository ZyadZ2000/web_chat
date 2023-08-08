// Third Party
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

// Node modules
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public/assets'));
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4());
  },
});

const upload = multer({ storage });

export default upload;
