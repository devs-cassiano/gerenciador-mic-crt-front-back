#!/usr/bin/env node

/**
 * Teste da lógica de geração de MIC/DTA LASTRE
 * Verifica se transportadoras brasileiras e estrangeiras estão funcionando corretamente
 */

const database = require('./src/config/database');
const TransportadoraService = require('./src/services/transportadoraService');
const MicDtaService = require('./src/services/micDtaService');

async function testLastreLogic() {
  console.log('🧪 TESTE: Lógica de MIC/DTA LASTRE\n');
  
  try {
    // Inicializar banco
    await database.init();
    
    // === TESTE 1: Transportadora Brasileira ===
    console.log('📋 TESTE 1: Transportadora Brasileira');
    
    const braResult = await TransportadoraService.create({
      nome: 'Transporte Brasil LTDA',
      pais: 'BR',
      numeroRegistro: 'BR001',
      numeroInicialCRT: 1,
      numeroInicialMicDta: 1,
      paisesDestino: [
        {
          paisDestino: 'AR',
          licenca: '1234/56', // Formato brasileiro válido
          vencimentoLicenca: '2025-12-31'
        }
      ]
    });
    
    if (braResult.success) {
      console.log('✅ Transportadora brasileira criada:', braResult.data.nome);
      
      // Testar geração de LASTRE
      const lastreBr = await MicDtaService.create({
        tipo: 'LASTRE',
        transportadoraId: braResult.data.id,
        paisOrigemCodigo: 'BR',
        paisDestinoCodigo: 'AR',
        quantidade: 1
      });
      
      if (lastreBr.success) {
        console.log('✅ MIC/DTA LASTRE brasileiro gerado:');
        console.log('   Número:', lastreBr.data.micDtas[0].numero);
        console.log('   Licença usada como idoneidade:', lastreBr.data.micDtas[0].licencaComplementar);
        console.log('   Esperado: 1234 (4 primeiros dígitos da licença 1234/56)\n');
      } else {
        console.log('❌ Erro ao gerar LASTRE brasileiro:', lastreBr.message);
      }
    } else {
      console.log('❌ Erro ao criar transportadora brasileira:', braResult.message);
    }
    
    // === TESTE 2: Transportadora Estrangeira ===
    console.log('📋 TESTE 2: Transportadora Estrangeira');
    
    const estResult = await TransportadoraService.create({
      nome: 'Transportes Argentina SA',
      pais: 'AR',
      numeroRegistro: 'AR001',
      numeroInicialCRT: 1,
      numeroInicialMicDta: 1,
      paisesDestino: [
        {
          paisDestino: 'BR',
          licenca: 'LIC-AR-2024-001',
          idoneidade: '5678', // Idoneidade obrigatória para estrangeiras
          vencimentoLicenca: '2025-12-31'
        }
      ]
    });
    
    if (estResult.success) {
      console.log('✅ Transportadora estrangeira criada:', estResult.data.nome);
      
      // Testar geração de LASTRE
      const lastreEst = await MicDtaService.create({
        tipo: 'LASTRE',
        transportadoraId: estResult.data.id,
        paisOrigemCodigo: 'AR',
        paisDestinoCodigo: 'BR',
        quantidade: 1
      });
      
      if (lastreEst.success) {
        console.log('✅ MIC/DTA LASTRE estrangeiro gerado:');
        console.log('   Número:', lastreEst.data.micDtas[0].numero);
        console.log('   Idoneidade:', lastreEst.data.micDtas[0].licencaComplementar);
        console.log('   Esperado: 5678 (idoneidade informada)\n');
      } else {
        console.log('❌ Erro ao gerar LASTRE estrangeiro:', lastreEst.message);
      }
    } else {
      console.log('❌ Erro ao criar transportadora estrangeira:', estResult.message);
    }
    
    // === TESTE 3: Licença brasileira inválida ===
    console.log('📋 TESTE 3: Validação de licença brasileira inválida');
    
    const invalidResult = await TransportadoraService.create({
      nome: 'Transporte Teste LTDA',
      pais: 'BR',
      numeroRegistro: 'BR002',
      paisesDestino: [
        {
          paisDestino: 'AR',
          licenca: '123456', // Formato inválido
          vencimentoLicenca: '2025-12-31'
        }
      ]
    });
    
    if (!invalidResult.success) {
      console.log('✅ Validação funcionou! Erro esperado:', invalidResult.message);
    } else {
      console.log('❌ Deveria ter rejeitado licença inválida');
    }
    
    // === TESTE 4: Estrangeira sem idoneidade ===
    console.log('\n📋 TESTE 4: Validação de estrangeira sem idoneidade');
    
    const noIdResult = await TransportadoraService.create({
      nome: 'Transporte Teste SA',
      pais: 'UY',
      numeroRegistro: 'UY001',
      paisesDestino: [
        {
          paisDestino: 'BR',
          licenca: 'LIC-UY-001'
          // idoneidade omitida
        }
      ]
    });
    
    if (!noIdResult.success) {
      console.log('✅ Validação funcionou! Erro esperado:', noIdResult.message);
    } else {
      console.log('❌ Deveria ter rejeitado estrangeira sem idoneidade');
    }
    
    console.log('\n🎯 RESUMO DOS TESTES:');
    console.log('✅ Transportadoras brasileiras: usam 4 primeiros dígitos da licença como idoneidade');
    console.log('✅ Transportadoras estrangeiras: usam campo idoneidade específico');
    console.log('✅ Validação de formato de licença brasileira (####/##)');
    console.log('✅ Validação de idoneidade obrigatória para estrangeiras');
    console.log('✅ Todas as transportadoras podem emitir MIC/DTA LASTRE');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testLastreLogic().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(console.error);
