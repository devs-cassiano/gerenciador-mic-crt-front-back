const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(
        path.join(__dirname, '../../database.sqlite'),
        (err) => {
          if (err) {
            console.error('Erro ao conectar com o banco:', err.message);
            reject(err);
          } else {
            console.log('Conectado ao banco SQLite');
            this.createTables().then(resolve).catch(reject);
          }
        }
      );
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const transportadoraTable = `
        CREATE TABLE IF NOT EXISTS transportadoras (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          pais TEXT NOT NULL,
          numeroRegistro TEXT UNIQUE NOT NULL,
          numeroInicialCRT INTEGER DEFAULT 1,
          numeroInicialMicDta INTEGER DEFAULT 1,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const destinationLicensesTable = `
        CREATE TABLE IF NOT EXISTS destination_licenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transportadoraId INTEGER NOT NULL,
          paisDestino TEXT NOT NULL,
          licenca TEXT NOT NULL,
          idoneidade TEXT,
          vencimentoLicenca TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(transportadoraId, paisDestino),
          FOREIGN KEY (transportadoraId) REFERENCES transportadoras (id) ON DELETE CASCADE
        )
      `;

      const crtTable = `
        CREATE TABLE IF NOT EXISTS crt (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero TEXT UNIQUE NOT NULL,
          paisOrigemCodigo TEXT NOT NULL,
          paisDestinoCodigo TEXT NOT NULL,
          licencaComplementar TEXT NOT NULL,
          numeroSequencial INTEGER NOT NULL,
          faturaComercial TEXT NOT NULL,
          exportador TEXT NOT NULL,
          importador TEXT NOT NULL,
          dataCriacao TEXT NOT NULL,
          transportadoraId INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (transportadoraId) REFERENCES transportadoras (id)
        )
      `;

      // Tabela MIC/DTA atualizada (sem campo crtId, relação via tabela de junção)
      const micDtaTable = `
        CREATE TABLE IF NOT EXISTS mic_dta (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero TEXT UNIQUE NOT NULL,
          tipo TEXT NOT NULL DEFAULT 'NORMAL',
          paisOrigemCodigo TEXT NOT NULL,
          paisDestinoCodigo TEXT NOT NULL,
          licencaComplementar TEXT NOT NULL,
          numeroSequencial INTEGER NOT NULL,
          transportadoraId INTEGER NOT NULL,
          dataCriacao TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (transportadoraId) REFERENCES transportadoras (id),
        CHECK (tipo IN ('NORMAL', 'LASTRE'))
      )
    `;

      // Relação muitos-para-muitos MIC/DTA <-> CRT
      const micdtaCrtTable = "CREATE TABLE IF NOT EXISTS micdta_crt (micDtaId INTEGER NOT NULL, crtId INTEGER NOT NULL, PRIMARY KEY (micDtaId, crtId), FOREIGN KEY (micDtaId) REFERENCES mic_dta(id) ON DELETE CASCADE, FOREIGN KEY (crtId) REFERENCES crt(id) ON DELETE CASCADE);";

      const numberSequenceTable = `
        CREATE TABLE IF NOT EXISTS number_sequences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tipo TEXT NOT NULL,
          transportadoraId INTEGER NOT NULL,
          ultimoNumero INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tipo, transportadoraId),
          FOREIGN KEY (transportadoraId) REFERENCES transportadoras (id)
        )
      `;

      // Executar criação das tabelas em sequência e aguardar migrações
      this.db.serialize(() => {
        this.db.run(transportadoraTable);
        this.db.run(destinationLicensesTable);
        this.db.run(crtTable);
        this.db.run(micDtaTable);
        this.db.run(micdtaCrtTable);
        this.db.run(numberSequenceTable, async () => {
          // Executar migrações somente após todas as tabelas serem criadas
          console.log('Tabelas criadas, executando migrações...');
          await new Promise(res => { this.runMigrations(); this.runDestinationLicensesMigrations(); setTimeout(res, 500); });
          resolve();
        });
      });
    });
  }

  runMigrations() {
    // Verificar se a tabela mic_dta existe antes de executar migrações
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='mic_dta'", (err, table) => {
      if (err) {
        console.error('Erro ao verificar tabela mic_dta:', err.message);
        return;
      }
      
      if (!table) {
        console.log('Tabela mic_dta não existe, pulando migrações');
        return;
      }

      // Migração para adicionar campos tipo e dataCriacao na tabela mic_dta
      this.db.all("PRAGMA table_info(mic_dta)", (err, columns) => {
        if (err) {
          console.error('Erro ao verificar estrutura da tabela mic_dta:', err.message);
          return;
        }

        const hasTipo = columns.some(col => col.name === 'tipo');
        const hasDataCriacao = columns.some(col => col.name === 'dataCriacao');
        
        if (!hasTipo) {
          console.log('Executando migração: adicionando campo tipo à tabela mic_dta');
          this.db.run(`ALTER TABLE mic_dta ADD COLUMN tipo TEXT NOT NULL DEFAULT 'NORMAL'`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Erro na migração do campo tipo:', err.message);
            } else {
              console.log('Campo tipo adicionado com sucesso');
            }
          });
        }

        if (!hasDataCriacao) {
          console.log('Executando migração: adicionando campo dataCriacao à tabela mic_dta');
          this.db.run(`ALTER TABLE mic_dta ADD COLUMN dataCriacao TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Erro na migração do campo dataCriacao:', err.message);
            } else {
              console.log('Campo dataCriacao adicionado com sucesso');
              
              // Atualizar registros existentes com data atual
              this.db.run(`UPDATE mic_dta SET dataCriacao = date('now') WHERE dataCriacao IS NULL`, (err) => {
                if (err) {
                  console.error('Erro ao atualizar dataCriacao existentes:', err.message);
                } else {
                  console.log('Registros existentes atualizados com dataCriacao');
                }
              });
            }
          });
        }

        // (Removido: migração de crtId, pois relação agora é via tabela de junção)
      });
    });
  }

  // (Removido: método recreateMicDtaTable, pois não há mais campo crtId na tabela mic_dta)

  getInstance() {
    return this.db;
  }

  runDestinationLicensesMigrations() {
    // Verificar se a tabela destination_licenses existe antes de executar migrações
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='destination_licenses'", (err, table) => {
      if (err) {
        console.error('Erro ao verificar tabela destination_licenses:', err.message);
        return;
      }
      
      if (!table) {
        console.log('Tabela destination_licenses não existe, pulando migrações');
        return;
      }

      // Migração para adicionar campos na tabela destination_licenses
      this.db.all("PRAGMA table_info(destination_licenses)", (err, columns) => {
        if (err) {
          console.error('Erro ao verificar estrutura da tabela destination_licenses:', err.message);
          return;
        }

        const hasVencimentoLicenca = columns.some(col => col.name === 'vencimentoLicenca');
        const hasIdoneidade = columns.some(col => col.name === 'idoneidade');
        
        if (!hasVencimentoLicenca) {
          console.log('Executando migração: adicionando campo vencimentoLicenca à tabela destination_licenses');
          this.db.run(`ALTER TABLE destination_licenses ADD COLUMN vencimentoLicenca TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Erro na migração do campo vencimentoLicenca:', err.message);
            } else {
              console.log('Campo vencimentoLicenca adicionado com sucesso à tabela destination_licenses');
            }
          });
        }

        if (!hasIdoneidade) {
          console.log('Executando migração: adicionando campo idoneidade à tabela destination_licenses');
          this.db.run(`ALTER TABLE destination_licenses ADD COLUMN idoneidade TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('Erro na migração do campo idoneidade:', err.message);
            } else {
              console.log('Campo idoneidade adicionado com sucesso à tabela destination_licenses');
            }
          });
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Erro ao fechar banco de dados:', err.message);
        } else {
          console.log('Conexão com banco de dados fechada');
        }
      });
    }
  }
}


module.exports = new Database();

// Permite rodar a criação das tabelas ao executar o script diretamente
if (require.main === module) {
  const dbInstance = new Database();
  dbInstance.connect().then(() => {
    console.log('Banco de dados inicializado com sucesso.');
    dbInstance.close();
  }).catch((err) => {
    console.error('Erro ao inicializar banco de dados:', err);
  });
}