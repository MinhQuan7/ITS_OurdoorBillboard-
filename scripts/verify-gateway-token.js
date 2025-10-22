const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "config.json");
try {
  const raw = fs.readFileSync(configPath, "utf8");
  const cfg = JSON.parse(raw);
  const auth = cfg?.eraIot?.authToken || "";
  const match = auth.match(/Token\s+(.+)/);
  const gateway = match ? match[1] : null;
  console.log("authToken raw:", auth);
  console.log("parsed gateway token:", gateway);
} catch (e) {
  console.error("Failed to read config:", e.message);
  process.exit(1);
}
