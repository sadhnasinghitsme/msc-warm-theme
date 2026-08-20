require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const contactRoutes = require('./routes/contactRoutes');
const contentRoutes = require('./routes/contentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

connectDB();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server) which send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.get('/', (req, res) => res.json({ status: 'ok', service: 'sks-warm-backend' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
