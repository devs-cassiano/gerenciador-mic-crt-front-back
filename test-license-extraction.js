#!/usr/bin/env node

/**
 * Teste rápido da extração de 4 dígitos da licença brasileira
 */

// Testar a regex
function testLicenseExtraction(licenca) {
  const match = licenca.match(/^[A-Z]*(\d{4})/);
  if (match) {
    console.log(`✅ ${licenca} → ${match[1]}`);
    return match[1];
  } else {
    console.log(`❌ ${licenca} → INVÁLIDA`);
    return null;
  }
}

console.log('🧪 TESTE: Extração de 4 dígitos da licença brasileira\n');

// Casos de teste
const testCases = [
  'BR6023/1800648',  // Caso real informado
  '6023/1800648',    // Sem prefixo BR
  'BR1234/56',       // Formato antigo
  '1234/56',         // Formato antigo sem BR
  'ABC6789/123',     // Com prefixo diferente
  '6789ABC/123',     // Dígitos no início
  'BR123',           // Sem barra
  'INVALID'          // Inválido
];

testCases.forEach(testCase => {
  testLicenseExtraction(testCase);
});

console.log('\n📝 RESULTADO:');
console.log('- BR6023/1800648 deve extrair: 6023');
console.log('- A regex funciona para formatos com ou sem prefixo de letras');
console.log('- Extrai sempre os 4 primeiros dígitos encontrados');
