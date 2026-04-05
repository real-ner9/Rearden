const http = require("http");
const crypto = require("crypto");
const { execFile } = require("child_process");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const PORT = Number(process.env.WEBHOOK_PORT) || 9090;
const SECRET = process.env.WEBHOOK_SECRET;

function verifySignature(payload, signature) {
  if (!SECRET) return true;
  const hmac = crypto.createHmac("sha256", SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404);
    return res.end("Not found");
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    // Verify signature
    const sig = req.headers["x-hub-signature-256"] || "";
    if (SECRET && !verifySignature(body, sig)) {
      console.log("Invalid signature, rejecting");
      res.writeHead(403);
      return res.end("Invalid signature");
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400);
      return res.end("Invalid JSON");
    }

    // Only handle push events
    const event = req.headers["x-github-event"];
    if (event !== "push") {
      res.writeHead(200);
      return res.end("Ignored event: " + event);
    }

    // Extract branch from ref (refs/heads/main -> main)
    const ref = payload.ref || "";
    const branch = ref.replace("refs/heads/", "");

    if (branch !== "main" && branch !== "dev") {
      res.writeHead(200);
      return res.end("Ignored branch: " + branch);
    }

    console.log(
      `[${new Date().toISOString()}] Push to ${branch} by ${payload.pusher?.name || "unknown"}`
    );

    // Run deploy script
    const deployScript = path.join(__dirname, "deploy.sh");
    const child = execFile("bash", [deployScript, branch], {
      timeout: 600000,
    });

    child.stdout.on("data", (data) => process.stdout.write(data));
    child.stderr.on("data", (data) => process.stderr.write(data));
    child.on("close", (code) => {
      console.log(
        `[${new Date().toISOString()}] Deploy ${branch} finished with code ${code}`
      );
    });

    res.writeHead(200);
    res.end("Deploy started for branch: " + branch);
  });
});

server.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log(`Endpoint: http://0.0.0.0:${PORT}/webhook`);
});
