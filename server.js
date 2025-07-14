const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT} em ${HOST}`);
  console.log(`📚 Documentação disponível em: http://${HOST === '0.0.0.0' ? 'seu-ip-ou-dns' : HOST}:${PORT}`);
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