// Push to client GitHub (origin)
// One-liner: git add . && git commit -m "Update" && git push origin main

import { execSync } from "child_process";

console.log("Pushing to CLIENT (origin)...\n");

try {
  execSync('git add . && git commit -m "Update" && git push origin main', {
    stdio: "inherit",
  });
  console.log("\n✓ Successfully pushed to client (origin)");
} catch {
  console.log("\n✗ Push failed or nothing to commit");
  process.exit(1);
}
