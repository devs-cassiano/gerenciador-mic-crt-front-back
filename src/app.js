const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerDocument, swaggerOptions } = require('./config/swagger');
const database = require('./config/database');

// Inicializar banco de dados
database.connect().catch(console.error);

// Importar rotas
const transportadoraRoutes = require('./routes/transportadoraRoutes');
const crtRoutes = require('./routes/crtRoutes');
const micDtaRoutes = require('./routes/micDtaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Rotas da API
app.use('/api/transportadoras', transportadoraRoutes);
app.use('/api/crt', crtRoutes);
app.use('/api/mic-dta', micDtaRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota para países (configuração)
app.get('/api/countries', (req, res) => {
  const { COUNTRIES } = require('./config/countries');
  res.json({
    success: true,
    data: Object.values(COUNTRIES)
  });
});

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Transportadoras funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: '/api-docs'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    statusCode: 500
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    statusCode: 404
  });
});

module.exports = app;