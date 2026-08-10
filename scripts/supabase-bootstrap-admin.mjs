#!/usr/bin/env node
/**
 * Promove guilhermegalli7@gmail.com a ADMIN e remove usuários de teste.
 * Requer: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Opcional: SUPABASE_DB_URL para aplicar migrations SQL via psql.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const ADMIN_EMAIL = "guilhermegalli7@gmail.com";
const TEST_EMAILS = new Set([
  "admin@forja.app",
  "personal@forja.app",
  "aluno@forja.app",
  "test@forja.app",
  "teste@forja.app",
  "demo@forja.app",
]);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!url || !serviceKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY (sb_secret_...)",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function resolveDbUrl() {
  if (dbUrl) return dbUrl;
  if (!dbPassword) return null;
  // Pooler IPv4 — aws-1-us-west-2 (mesmo padrão CCTVC)
  const ref = new URL(url).hostname.split(".")[0];
  return `postgresql://postgres.${ref}:${encodeURIComponent(dbPassword)}@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require`;
}

function applyMigrationsWithPsql() {
  const connection = resolveDbUrl();
  if (!connection) {
    console.log(
      "SUPABASE_DB_URL / SUPABASE_DB_PASSWORD ausente — pulando SQL migrations.",
    );
    return false;
  }
  const dir = join(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const path = join(dir, file);
    console.log(`Aplicando ${file}...`);
    const sql = readFileSync(path, "utf8");
    const result = spawnSync(
      "psql",
      [connection, "-v", "ON_ERROR_STOP=1", "-c", sql],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
    );
    if (result.status !== 0) {
      const err = `${result.stderr || ""}\n${result.stdout || ""}`;
      if (/already exists/i.test(err)) {
        console.warn(`  (já existia) ${file}`);
        continue;
      }
      console.error(err);
      process.exit(1);
    } else {
      console.log(`OK ${file}`);
    }
  }
  return true;
}

async function listAllUsers() {
  const users = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users?.length || data.users.length < 200) break;
    page += 1;
  }
  return users;
}

async function main() {
  applyMigrationsWithPsql();

  const users = await listAllUsers();
  console.log(`Usuários Auth: ${users.length}`);

  for (const user of users) {
    const email = (user.email || "").toLowerCase();
    if (!email) continue;

    const isTest =
      TEST_EMAILS.has(email) ||
      email.endsWith("@forja.app") ||
      email.startsWith("teste@") ||
      email.startsWith("test@") ||
      email.startsWith("demo@");

    if (isTest && email !== ADMIN_EMAIL) {
      console.log(`Excluindo usuário teste: ${email}`);
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) console.error(`  falha: ${error.message}`);
      else console.log("  removido");
      continue;
    }

    if (email === ADMIN_EMAIL) {
      console.log(`Promovendo admin: ${email}`);
      const { error } = await admin
        .from("profiles")
        .update({ role: "ADMIN" })
        .eq("id", user.id);
      if (error) console.error(`  falha profile: ${error.message}`);
      else console.log("  profiles.role = ADMIN");

      await admin.from("app_settings").upsert({
        key: "admin_emails",
        value: ADMIN_EMAIL,
      });
    }
  }

  await admin.from("app_settings").upsert({
    key: "admin_emails",
    value: ADMIN_EMAIL,
  });

  const remaining = await listAllUsers();
  console.log(
    "Restantes:",
    remaining.map((u) => u.email).join(", ") || "(nenhum)",
  );
  console.log("Ambiente Auth pronto para produção (sem usuários demo).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
