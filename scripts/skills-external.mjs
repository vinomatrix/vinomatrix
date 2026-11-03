// @ts-check
// Read-only mirrors of upstream sources (skills/external.json), cloned at the versions we install
// so their code can be read. Mirrors are gitignored and disposable: update discards local edits.
//
// Usage: node scripts/skills-external.mjs <mount|update|unmount> [name]
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

/** @typedef {{ repo: string; ref: string; description: string; mountDir: string }} Source */

const root = join(import.meta.dirname, "..");
const mountRoot = join(root, "skills", "external");
/** @type {unknown} */
const config = JSON.parse(readFileSync(join(root, "skills", "external.json"), "utf8"));
const sources = /** @type {Record<string, Source>} */ (config);

/**
 * @param {string[]} args
 * @param {string} cwd
 */
const git = (args, cwd) => {
  execFileSync("git", ["-c", "advice.detachedHead=false", ...args], { cwd, stdio: "inherit" });
};

/** @type {Record<string, (name: string, source: Source, dir: string) => void>} */
const commands = {
  mount: (name, { repo, ref }, dir) => {
    if (existsSync(dir)) {
      console.log(`${name}: Already mounted`);
      return;
    }
    git(["clone", "--quiet", "--depth", "1", "--branch", ref, repo, dir], root);
    console.log(`${name}: mounted at ${ref}`);
  },
  update: (name, { repo, ref }, dir) => {
    if (!existsSync(dir)) {
      console.log(`${name}: not mounted, skipped`);
      return;
    }
    git(["remote", "set-url", "origin", repo], dir);
    git(["fetch", "--quiet", "--depth", "1", "origin", ref], dir);
    git(["checkout", "--quiet", "--force", "FETCH_HEAD"], dir);
    git(["clean", "--quiet", "-fd"], dir);
    console.log(`${name}: updated to ${ref}`);
  },
  unmount: (name, _source, dir) => {
    rmSync(dir, { recursive: true, force: true });
    console.log(`${name}: unmounted`);
  },
};

const [command, name] = process.argv.slice(2).filter((arg) => arg !== "--");
const run = command === undefined ? undefined : commands[command];
const names = name === undefined ? Object.keys(sources) : [name];

if (run === undefined || names.some((n) => !(n in sources))) {
  console.error(
    `Usage: skills-external.mjs <${Object.keys(commands).join("|")}> [name]\n` +
      `Sources:\n${Object.entries(sources)
        .map(([n, s]) => `  ${n.padEnd(12)} ${s.ref}  ${s.description}`)
        .join("\n")}`,
  );
  process.exit(1);
}

for (const n of names) {
  const source = /** @type {Source} */ (sources[n]);
  run(n, source, join(mountRoot, source.mountDir));
}
