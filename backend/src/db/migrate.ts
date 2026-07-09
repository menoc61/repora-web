import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { config } from '../config'

const migrationClient = postgres(config.databaseUrl, { max: 1 })
const db = drizzle(migrationClient)

await migrate(db, { migrationsFolder: './src/db/migrations' })
await migrationClient.end()
