import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const normalize = (value) => JSON.parse(JSON.stringify(value));
function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}
const makeContext = () => {
  const fixed = Date.parse("2026-10-14T12:00:00Z");
  const context = vm.createContext({
    localStorage: storage(),
    sessionStorage: storage(),
    Date: class extends Date {
      constructor(...args) {
        super(...(args.length ? args : [fixed]));
      }
      static now() {
        return fixed;
      }
    },
  });
  context.window = context;
  return context;
};
async function setup(react) {
  const context = makeContext();
  if (react) {
    // The only test adaptation is removing module syntax for an isolated VM.
    vm.runInContext(
      (await read("src/services/data.js")).replace(
        "export const data",
        "const data",
      ),
      context,
    );
    vm.runInContext(
      (await read("src/services/api.js"))
        .replace("import { data } from './data.js';", "")
        .replace("export const api", "const api") + "\nthis.api = api;",
      context,
    );
  } else {
    vm.runInContext(await read("../js/data.js"), context);
    vm.runInContext(await read("../js/api.js"), context);
    context.api = context.DLF.api;
  }
  return context;
}

test("every original HTML, CSS, script, and SVG is byte-for-byte unchanged", async () => {
  const manifest = JSON.parse(await read("original-files.sha256.json"));
  for (const [name, hash] of Object.entries(manifest)) {
    const bytes = await readFile(new URL(`../${name}`, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, name);
  }
});

test("React services retain the exact legacy implementations", async () => {
  for (const name of ["data", "api", "socket"]) {
    let expected = (await read(`../js/${name}.js`))
      .replaceAll("\r\n", "\n")
      .replace("window.DLF = window.DLF || {};\n", "")
      .replace(`DLF.${name} =`, `export const ${name} =`)
      .replaceAll("DLF.data", "data");
    if (name === "api")
      expected = "import { data } from './data.js';\n\n" + expected;
    assert.equal(
      (await read(`src/services/${name}.js`)).replaceAll("\r\n", "\n"),
      expected,
    );
  }
});

test("legacy and React API return the same results throughout a full session", async () => {
  const old = await setup(false),
    current = await setup(true);
  async function same(method, ...args) {
    const invoke = async (context) => {
      try {
        return {
          result: normalize((await context.api[method](...args)) ?? null),
        };
      } catch (error) {
        return { error: error.message };
      }
    };
    assert.deepEqual(await invoke(current), await invoke(old), method);
    assert.deepEqual(
      [...current.localStorage.values],
      [...old.localStorage.values],
      `${method}: localStorage`,
    );
    assert.deepEqual(
      [...current.sessionStorage.values],
      [...old.sessionStorage.values],
      `${method}: sessionStorage`,
    );
  }
  await same("getItems");
  await same("loginUser", {
    email: "student@eng.ruh.ac.lk",
    password: "demo",
    remember: true,
  });
  await same("getUser");
  await same("getMyReports");
  await same("searchItems", "black electronics library found");
  await same("getLostItems", { category: "Books", date: "2026-09-26" });
  await same("getFoundItems", { status: "Returned" });
  const report = {
    name: "Parity Notebook",
    category: "Books",
    color: "Blue",
    date: "2026-10-01",
    location: "Library",
    description: "A notebook used for migration verification.",
    image: "",
  };
  const id = Date.parse("2026-10-14T12:00:00Z");
  await same("reportLostItem", report);
  await same("getItem", id);
  await same("updateReport", id, { ...report, name: "Edited Notebook" });
  await same("resolveReport", id);
  await same("deleteReport", id);
  await same("reportFoundItem", report);
  await same("resolveReport", id);
  await same("deleteReport", id);
  await same("deleteReport", 2); // Ownership rejection.
  await same("claimItem", 7, "short");
  await same("claimItem", 7, "The cover has a distinguishing scratch.");
  await same("claimItem", 7, "Duplicate proof of ownership.");
  await same("getNotifications");
  await same("markNotificationsRead", 1);
  await same("markNotificationsRead");
  await same(
    "contactReporter",
    7,
    "This is a test message saved only locally.",
  );
  await same("getMatches");
  await same("dismissMatch", 1);
  await same("getMatches");
  await same("updateProfile", {
    name: "Updated Student",
    email: "updated@example.edu",
    registration: "EG/2023/TEST",
  });
  await same("changePassword", "example-password");
  await same("logout");
  await same("getSession");
  await same("getMyReports");
  await same("registerUser", {
    name: "New Student",
    email: "new@example.edu",
    registration: "EG/TEST",
    password: "example123",
  });
  await same("loginUser", {
    email: "new@example.edu",
    password: "anything",
    remember: false,
  });
  await same("getUser");
  await same("getMyReports");
  await same("getNotifications");
  await same("getMatches");
});

test("React imports all original stylesheets in original cascade order", async () => {
  const source = await read("src/main.jsx");
  const imports = [
    ...source.matchAll(/import ["']\.\.\/\.\.\/css\/([^"']+)["']/g),
  ].map((match) => match[1]);
  assert.deepEqual(imports, [
    "style.css",
    "landing.css",
    "auth.css",
    "dashboard.css",
    "responsive.css",
  ]);
});

test("all thirteen original URLs are React routes", async () => {
  const app = await read("src/App.jsx");
  const pages = (await readdir(new URL("../", root))).filter((name) =>
    name.endsWith(".html"),
  );
  for (const page of pages) assert.ok(app.includes(`path="/${page}"`), page);
});
