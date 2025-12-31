// Push to demo GitHub (demo)
// One-liner: git add . && git commit -m "Update" && git push demo main

import { execSync } from "child_process";

console.log("Pushing to DEMO...\n");

try {
  execSync('git add . && git commit -m "Update" && git push demo main', {
    stdio: "inherit",
  });
  console.log("\n✓ Successfully pushed to demo");
} catch {
  console.log("\n✗ Push failed or nothing to commit");
  process.exit(1);
}
