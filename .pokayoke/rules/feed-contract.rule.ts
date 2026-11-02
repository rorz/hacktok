import type { Finding, Rule } from "pokayoke";

export const feedContract: Rule = {
  meta: {
    id: "repo/feed-contract",
    docs: "Keep the feed lightweight, the user's dev port stable, and the requested verification contract intact.",
    kind: "project",
  },
  async run(context) {
    const findings: Finding[] = [];
    const report = (file: string, message: string) =>
      findings.push({
        ruleId: "repo/feed-contract",
        severity: "error",
        file,
        message,
      });
    const manifest = JSON.parse(await context.readFile("package.json"));
    if (!manifest.scripts.dev.includes("--strictPort")) {
      report(
        "package.json",
        "The dev server must fail on a busy port instead of choosing another.",
      );
    }
    for (const command of ["typecheck", "lint", "knip", "policy"]) {
      if (!manifest.scripts.check.includes(`bun run ${command}`)) {
        report("package.json", `The check command must include ${command}.`);
      }
    }
    const sourceFiles = await context.glob(["src/**/*.ts", "src/**/*.tsx"]);
    for (const file of sourceFiles) {
      const source = await context.readFile(file);
      if (
        /from\s+["'][^"']*data\/(catalog|formats|comment-ids)\.json["']/.test(
          source,
        )
      ) {
        report(
          file,
          "The full catalog belongs in the Worker, not the browser bundle.",
        );
      }
    }
    const tests = await context.glob([
      "src/**/*.test.*",
      "worker/**/*.test.*",
      "scripts/**/*.test.*",
      ".pokayoke/**/*.test.*",
    ]);
    for (const file of tests)
      report(
        file,
        "This project explicitly uses static checks and manual browser verification, without tests.",
      );
    return { findings };
  },
};
