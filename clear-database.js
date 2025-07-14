const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🗑️  Iniciando limpeza do banco de dados...');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado ao banco SQLite');
    clearAllTables();
  }
});

function clearAllTables() {
  console.log('🧹 Limpando todas as tabelas...');
  
  // Desabilitar foreign keys temporariamente para evitar erros de referência
  db.run('PRAGMA foreign_keys = OFF', (err) => {
    if (err) {
      console.error('❌ Erro ao desabilitar foreign keys:', err.message);
      return;
    }

    // Lista de tabelas para limpar (em ordem para evitar conflitos de foreign key)
    const tables = [
      'mic_dta',
      'crt', 
      'destination_licenses',
      'number_sequences',
      'transportadoras'
    ];

    let clearedCount = 0;

    // Limpar cada tabela
    tables.forEach((table, index) => {
      db.run(`DELETE FROM ${table}`, function(err) {
        if (err) {
          console.error(`❌ Erro ao limpar tabela ${table}:`, err.message);
        } else {
          console.log(`✅ Tabela ${table} limpa (${this.changes} registros removidos)`);
        }
        
        clearedCount++;
        
        // Se todas as tabelas foram processadas
        if (clearedCount === tables.length) {
          // Resetar os contadores AUTO_INCREMENT
          resetAutoIncrement();
        }
      });
    });
  });
}

function resetAutoIncrement() {
  console.log('🔄 Resetando contadores AUTO_INCREMENT...');
  
  const tables = ['transportadoras', 'destination_licenses', 'crt', 'mic_dta', 'number_sequences'];
  let resetCount = 0;

  tables.forEach((table) => {
    db.run(`DELETE FROM sqlite_sequence WHERE name = ?`, [table], function(err) {
      if (err) {
        console.error(`❌ Erro ao resetar contador da tabela ${table}:`, err.message);
      } else {
        console.log(`✅ Contador da tabela ${table} resetado`);
      }
      
      resetCount++;
      
      if (resetCount === tables.length) {
        // Reabilitar foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('❌ Erro ao reabilitar foreign keys:', err.message);
          } else {
            console.log('✅ Foreign keys reabilitadas');
          }
          
          // Fechar conexão
          db.close((err) => {
            if (err) {
              console.error('❌ Erro ao fechar banco de dados:', err.message);
            } else {
              console.log('✅ Conexão com banco de dados fechada');
              console.log('🎉 Limpeza do banco de dados concluída com sucesso!');
              console.log('');
              console.log('📝 Resumo:');
              console.log('   - Todos os registros foram removidos');
              console.log('   - Estrutura das tabelas mantida');
              console.log('   - Contadores AUTO_INCREMENT resetados');
              console.log('   - Banco pronto para novos dados');
            }
          });
        });
      }
    });
  });
}

// Tratar erros não capturados
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  process.exit(1);
});
