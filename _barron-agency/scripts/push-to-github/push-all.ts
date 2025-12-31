// Push to both GitHub repos (origin + demo)
// One-liner: git add . && git commit -m "Update" && git push origin main && git push demo main

import { execSync } from "child_process";

console.log("Pushing to BOTH (client + demo)...\n");

try {
  execSync(
    'git add . && git commit -m "Update" && git push origin main && git push demo main',
    {
      stdio: "inherit",
    }
  );
  console.log("\n✓ Successfully pushed to both repos");
} catch {
  console.log("\n✗ Push failed or nothing to commit");
  process.exit(1);
}
