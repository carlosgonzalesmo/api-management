import 'dotenv/config'; // <-- Esto carga automáticamente .env
import AppDataSource from './typeorm.config';

async function run() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL no está definido. Revisa tu archivo .env');
      process.exit(1);
    }
    console.log('Usando DATABASE_URL =', process.env.DATABASE_URL);
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    console.log('Migraciones ejecutadas');
    process.exit(0);
  } catch (err) {
    console.error('Error al ejecutar migraciones', err);
    process.exit(1);
  }
}

run();