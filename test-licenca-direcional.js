const TransportadoraService = require('./src/services/transportadoraService');
const DocumentNumberService = require('./src/services/documentNumberService');
const database = require('./src/config/database');

async function runTest() {
  await database.connect();
  console.log('🧪 Teste de emissão CRT/MIC-DTA com licença direcional');

  // Limpa banco
  await database.getInstance().run('DELETE FROM transportadoras');
  await database.getInstance().run('DELETE FROM destination_licenses');
  await database.getInstance().run('DELETE FROM number_sequences');

  // Cria transportadora PY com licença para BR
  const pyResult = await TransportadoraService.create({
    nome: 'TransPY',
    pais: 'PY',
    numeroRegistro: 'PY001',
    numeroInicialCRT: 1,
    numeroInicialMicDta: 1,
    paisesDestino: [
      {
        paisDestino: 'BR',
        licenca: 'LIC-PY-BR',
        idoneidade: 'IDONPY',
        vencimentoLicenca: '2025-12-31'
      }
    ]
  });
  const transportadoraId = pyResult.data.id;

  // Teste 1: Brasil -> Paraguai (deve permitir)
  try {
    const crtBrPy = await DocumentNumberService.getNextNumbers('CRT', transportadoraId, 'BR', 'PY', null, 1);
    console.log('✅ CRT Brasil → Paraguai permitido:', crtBrPy[0].numero);
  } catch (e) {
    console.log('❌ CRT Brasil → Paraguai bloqueado:', e.message);
  }

  // Teste 2: Paraguai -> Brasil (deve permitir)
  try {
    const crtPyBr = await DocumentNumberService.getNextNumbers('CRT', transportadoraId, 'PY', 'BR', null, 1);
    console.log('✅ CRT Paraguai → Brasil permitido:', crtPyBr[0].numero);
  } catch (e) {
    console.log('❌ CRT Paraguai → Brasil bloqueado:', e.message);
  }

  // Teste 3: Paraguai -> Argentina (sem licença, deve bloquear)
  try {
    const crtPyAr = await DocumentNumberService.getNextNumbers('CRT', transportadoraId, 'PY', 'AR', null, 1);
    console.log('❌ CRT Paraguai → Argentina permitido (ERRO):', crtPyAr[0].numero);
  } catch (e) {
    console.log('✅ CRT Paraguai → Argentina bloqueado:', e.message);
  }

  // Teste 4: Brasil -> Argentina (sem licença, deve bloquear)
  try {
    const crtBrAr = await DocumentNumberService.getNextNumbers('CRT', transportadoraId, 'BR', 'AR', null, 1);
    console.log('❌ CRT Brasil → Argentina permitido (ERRO):', crtBrAr[0].numero);
  } catch (e) {
    console.log('✅ CRT Brasil → Argentina bloqueado:', e.message);
  }
}

runTest();
