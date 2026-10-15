import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const BUMPS = ["patch", "minor", "major"];
const packageJsonPath = path.resolve(import.meta.dirname, "../client/package.json");

function git(...args) {
  return execFileSync("git", args, { encoding: "utf-8" }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (git("status", "--porcelain")) {
  fail("Arbre de travail non propre. Committe ou stash tes modifications avant de publier une version.");
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const parts = packageJson.version.split(".").map(Number);

if (parts.length !== 3 || parts.some(Number.isNaN)) {
  fail(`Version actuelle illisible dans client/package.json : "${packageJson.version}".`);
}

const [major, minor, patch] = parts;
const nextVersions = {
  patch: [major, minor, patch + 1].join("."),
  minor: [major, minor + 1, 0].join("."),
  major: [major + 1, 0, 0].join("."),
};

const ESC = String.fromCharCode(27);

async function askBump() {
  return new Promise((resolve) => {
    let selected = 0;
    let rendered = false;
    const render = () => {
      process.stdout.write(`${ESC}[?25l`);
      if (rendered) process.stdout.write(`${ESC}[${BUMPS.length}A`);
      rendered = true;
      for (const [i, b] of BUMPS.entries()) {
        const line = `${i === selected ? "❯" : " "} ${b.padEnd(5)} ${packageJson.version} → ${nextVersions[b]}`;
        process.stdout.write(`${ESC}[2K${line}\n`);
      }
    };
    console.log(`Version actuelle : ${packageJson.version}\n`);
    render();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf-8");
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write(`${ESC}[?25h`);
    };
    const onData = (key) => {
      if (key === String.fromCharCode(3)) {
        cleanup();
        process.exit(1);
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(BUMPS[selected]);
      } else if (key === `${ESC}[A`) {
        selected = (selected - 1 + BUMPS.length) % BUMPS.length;
        render();
      } else if (key === `${ESC}[B`) {
        selected = (selected + 1) % BUMPS.length;
        render();
      }
    };
    process.stdin.on("data", onData);
  });
}

const bump = process.argv[2] ?? (await askBump());

if (!BUMPS.includes(bump)) {
  fail(`Type de version invalide : "${bump}". Attendu : ${BUMPS.join(", ")}.`);
}

const version = nextVersions[bump];
const tag = `v${version}`;

if (git("tag", "--list", tag)) {
  fail(`Le tag ${tag} existe déjà.`);
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");

packageJson.version = version;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

git("add", "client/package.json");
git("commit", "-m", tag);
git("tag", "-a", tag, "-m", `Version ${version}`);

try {
  git("push", "--follow-tags", "origin", branch);
} catch {
  fail(
    `Push échoué. Le commit et le tag ${tag} existent en local. Relance : git push --follow-tags origin ${branch}`,
  );
}

console.log(`Version ${version} publiée sur ${branch} (tag ${tag}).`);
