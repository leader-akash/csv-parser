import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://csv-parser-fe.vercel.app'],
  credentials: true
}));

app.use(express.json());

app.use("/", (req, res) => {
  res.json({ status: 'ok', message: 'Api is running' });
});

app.use('/api', uploadRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
