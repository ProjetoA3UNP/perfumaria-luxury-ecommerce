require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    console.log("🛠️  Iniciando a configuração do banco de dados...");
    
    try {
        // Conexão inicial para criar e popular o banco usando a lib mysql2
        // A propriedade multipleStatements: true permite ler o arquivo .sql inteiro
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            ssl: process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
            multipleStatements: true 
        });
        
        console.log("✅ Conectado ao servidor MySQL com sucesso!");

        // Caminho inteligente: Volta uma pasta (sai do backend) e entra em database
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const sqlScript = fs.readFileSync(schemaPath, 'utf8');

        console.log("📜 Lendo e injetando o arquivo schema.sql...");
        
        // Executa todas as criações de banco e tabelas de uma só vez
        await connection.query(sqlScript);
        
        console.log("🚀 Banco e 14 tabelas gerados com sucesso no MySQL!");
        
        await connection.end();
    } catch (error) {
        console.error("❌ Erro ao subir o banco via terminal:\n", error);
        process.exit(1);
    }
}

setupDatabase();
