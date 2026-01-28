require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('API de Certificados funcionando correctamente');
});

// Import routes (placeholder for future implementation)
// const certificateRoutes = require('./routes/certificates');
// app.use('/api/certificates', certificateRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
