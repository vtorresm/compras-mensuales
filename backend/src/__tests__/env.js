const { tmpdir } = require('os');
const { join } = require('path');

// Configurar base de datos temporal para tests
const testDbPath = join(tmpdir(), `test-${Date.now()}.db`);
process.env.DATABASE_URL = `file:${testDbPath}`;