// Lê o .env (se existir) e devolve a URL do banco de teste, recusando apontar para o banco principal.
export function testDatabaseUrl() {
  try { process.loadEnvFile(".env"); } catch { /* sem .env: usa só as variáveis do ambiente */ }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Defina TEST_DATABASE_URL (ex.: postgresql://postgres:postgres@localhost:5432/nautiwork_test).");
  if (url === process.env.DATABASE_URL) throw new Error("TEST_DATABASE_URL não pode ser igual a DATABASE_URL: o teste apaga os dados.");
  if (!/test/i.test(new URL(url).pathname)) throw new Error("Por segurança, o nome do banco de teste precisa conter \"test\".");
  return url;
}
