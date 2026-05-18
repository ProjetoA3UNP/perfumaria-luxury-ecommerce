require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMegaSeeds() {
    console.log("🚀 Iniciando a megainjeção de 60 registros da AV3...");
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'essence_db',
            ssl: process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
            multipleStatements: true 
        });
        
        console.log("✅ Conectado ao servidor MySQL com sucesso!");

        const seedsPath = path.join(__dirname, '..', 'database', 'seeds.sql');
        const sqlScript = fs.readFileSync(seedsPath, 'utf8');

        console.log("📜 Analisando o script seeds.sql...");
        
        await connection.query(sqlScript);
        
        console.log("👑 BOOM! Banco populado com mais de 10 perfis, perfumes, notas e marcas completas!");
        console.log("Para verificar, acesse o MySQL e dê um SELECT * FROM produtos;");
        
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro fatal ao rodar as seeds da AV3:\n", error);
        process.exit(1);
    }
}

runMegaSeeds();
