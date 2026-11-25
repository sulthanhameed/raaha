// Generates the one-time initial catalogue migration from the bundled sample.
// Do not rerun against an already deployed database; use new migrations for
// deliberate future catalogue changes, or edit catalogue rows in the Dashboard.
import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

// Transpile locally rather than relying on Node's newer TypeScript stripping.
const source = readFileSync(new URL("../src/data/menu.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { CATEGORIES, MENU } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

const quote = (value) => value == null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const arr = (values) => `array[${values.map(quote).join(", ")}]::text[]`;
const categories = CATEGORIES.map((c, index) =>
  `  (${[quote(c.id), quote(c.name), quote(c.tagline), quote(c.description), quote(c.image), index].join(", ")})`
).join(",\n");
const dishes = MENU.map((m, index) =>
  `  (${[quote(m.id), quote(m.category), quote(m.name), quote(m.description), m.price, m.veg, arr(m.ingredients), quote(m.image), m.rating, m.ratingsCount, quote(m.time), quote(m.serves), quote(m.spice), quote(m.calories), quote(m.tag), index].join(", ")})`
).join(",\n");
const sql = `-- Initial representative menu. Verify dishes, prices and business details with the restaurant before accepting real requests.\n-- This runs once as a migration; it will not overwrite later catalogue edits.\ninsert into public.categories (id, name, tagline, description, image_url, position) values\n${categories}\non conflict (id) do nothing;\n\ninsert into public.menu_items (id, category_id, name, description, price_inr, vegetarian, ingredients, image_url, sample_rating, sample_rating_count, prep_time, serves, spice, calories, tag, position) values\n${dishes}\non conflict (id) do nothing;\n`;
writeFileSync(new URL("../../database/supabase/migrations/20261114000200_initial_catalog.sql", import.meta.url), sql);
console.log(`Wrote ${CATEGORIES.length} categories and ${MENU.length} dishes.`);
