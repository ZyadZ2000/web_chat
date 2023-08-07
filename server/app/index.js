/* Third party libraries */
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

/* Initializing the express server */
const app = express();

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

app.use(morgan('common'));

app.use(bodyParser.json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

app.use(cors());

app.use((req, res) => {
  res.status(404).json({ message: "This route doesn't exist" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});
