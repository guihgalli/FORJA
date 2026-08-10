#!/usr/bin/env node
/**
 * Promove guilhermegalli7@gmail.com a ADMIN e remove usuários de teste.
 * Requer: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Opcional: SUPABASE_DB_URL para aplicar migrations SQL via psql.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!url || !serviceKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function applyMigrationsWithPsql() {
  if (!dbUrl) {
    console.log(
      "SUPABASE_DB_URL ausente — pulando SQL migrations (rode no SQL Editor se necessário).",
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
    const result = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      // Migrations já aplicadas podem falhar em CREATE TYPE etc. — reporta e segue nas novas
      console.warn(`Aviso em ${file}:`, result.stderr || result.stdout);
      if (file.includes("admin_auth") || file.includes("bootstrap_admin")) {
        // critical for this task
        if (
          !String(result.stderr || "").includes("already exists") &&
          result.status !== 0
        ) {
          // retry individual statements is hard; fail only if clearly new migration failed hard
          console.error(result.stderr);
        }
      }
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
      if (error) {
        console.error(`  falha profile: ${error.message}`);
      } else {
        console.log("  profiles.role = ADMIN");
      }

      await admin.from("app_settings").upsert({
        key: "admin_emails",
        value: ADMIN_EMAIL,
      });
    }
  }

  // Se o admin ainda não existe no Auth, só deixa o setting pronto
  await admin.from("app_settings").upsert({
    key: "admin_emails",
    value: ADMIN_EMAIL,
  });

  const remaining = await listAllUsers();
  console.log(
    "Restantes:",
    remaining.map((u) => u.email).join(", ") || "(nenhum)",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
