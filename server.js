const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📚 Documentação disponível em: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Finalizando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Finalizando servidor...');
  process.exit(0);
});