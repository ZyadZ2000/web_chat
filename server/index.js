// Third Party
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Node Modules
import http from 'http';

// Custom Modules
import app from './app/index.js';
import io_init from './websockets/index.js';

const server = http.createServer(app);
io_init(server);

dotenv.config();

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });
