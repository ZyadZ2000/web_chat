/* Third party libraries */
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Node modules
import { fileURLToPath } from 'url';
import path from 'path';

// Custom modules
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import chatRouter from './routes/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Initializing the express server */
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

app.use(cors());

app.use(bodyParser.json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

app.use(morgan('common'));

app.use('/assets', express.static(path.join(__dirname, '..', 'public/assets')));

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/chat', chatRouter);

app.use((req, res) => {
  res.status(404).json({ message: "route doesn't exist" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

export default app;
