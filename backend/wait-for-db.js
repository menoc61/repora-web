import postgres from 'postgres';

const url = process.env.DATABASE_URL || 'postgres://repora:repora@db:5432/repora';

async function check() {
  const sql = postgres(url, { max: 1, connection_lifetime: 3 });
  try {
    await sql`SELECT 1`;
    console.log('ok');
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

check();
