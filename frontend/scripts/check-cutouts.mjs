import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(root, "src/data/menu.ts"), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});
const { MENU, CATEGORIES } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

assert.ok(MENU.length > 0, "The menu must contain at least one dish.");
const ids = new Set();
for (const item of MENU) {
  assert.match(item.id, /^[a-z0-9-]+$/, `Invalid menu item ID: ${item.id}`);
  assert.ok(!ids.has(item.id), `Duplicate menu item ID: ${item.id}`);
  ids.add(item.id);

  const file = path.join(root, "public/images/dish-cutouts", `${item.id}.webp`);
  let image;
  try {
    image = await readFile(file);
  } catch {
    throw new Error(`Missing tabletop cutout for ${item.id}: ${file}`);
  }

  const isWebP = image.length >= 25 && image.toString("ascii", 0, 4) === "RIFF" && image.toString("ascii", 8, 12) === "WEBP";
  const type = image.toString("ascii", 12, 16);
  // VP8X signals alpha in its feature flags; VP8L signals it in its lossless header.
  const hasAlpha = (type === "VP8X" && (image[20] & 0x10) !== 0) ||
    (type === "VP8L" && image[20] === 0x2f && (image[24] & 0x10) !== 0);
  assert.ok(isWebP && hasAlpha, `${item.id} needs a transparent WebP tabletop cutout`);
}

for (const category of CATEGORIES) {
  const representative = MENU.find((item) => item.image === category.image);
  assert.ok(representative && representative.category === category.id,
    `Category ${category.id} needs a representative image from one of its own dishes.`);
}

for (const asset of ["raaha-reference-table.webp", "food-unavailable.svg", "table-unavailable.svg"]) {
  const file = path.join(root, "public/images", asset);
  let contents;
  try {
    contents = await readFile(file);
  } catch {
    throw new Error(`Missing tabletop or fallback image: ${file}`);
  }
  assert.ok(contents.length > 0, `Empty tabletop or fallback image: ${file}`);
}

console.log(`Verified transparent tabletop cutouts for ${ids.size} menu items and category/fallback assets.`);
