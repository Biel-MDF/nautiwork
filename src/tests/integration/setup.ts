import { testDatabaseUrl } from "./env";
// Precisa rodar antes de qualquer import de "@/lib/db", que cria o PrismaClient.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
