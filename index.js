import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

/* ===========================
   CONFIG
=========================== */
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;
const TRUST_SECRET    = process.env.TRUST_SECRET || "change-this-long-secret";
const TRUST_TTL_MS    = 2 * 60 * 1000; // 2 minutes

const COOKIE_NAME     = "__rt"; // railway trust
const PORT            = process.env.PORT || 3000;

/* ===========================
   HELPERS
=========================== */
function hmac(data) {
  return crypto
    .createHmac("sha256", TRUST_SECRET)
    .update(data)
    .digest("base64url");
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig  = hmac(body);
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (hmac(body) !== sig) return null;

  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  if (Date.now() > data.exp) return null;
  return data;
}

/* ===========================
   PASSIVE SIGNAL ANALYSIS
=========================== */
function analyzeSignals(req, behavior = {}) {
  let score = 0;

  const ua = req.headers["user-agent"] || "";
  const lang = req.headers["accept-language"] || "";
  const webdriver = behavior.webdriver === true;

  if (!ua || ua.length < 20) score += 2;
  if (!lang) score += 1;
  if (webdriver) score += 3;
  if (!behavior.screen) score += 1;

  return score; // higher = worse
}

/* ===========================
   TURNSTILE VERIFY
=========================== */
async function verifyTurnstile(token, ip) {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET,
      response: token,
      remoteip: ip
    })
  });

  const data = await res.json();
  return data.success === true;
}

/* ===========================
   ISSUE TRUST TOKEN
=========================== */
app.post("/issue", async (req, res) => {
  const ip = req.headers["cf-connecting-ip"] || req.ip;
  const behavior = JSON.parse(req.body.behavior || "{}");

  // Turnstile is optional but recommended
  if (req.body.turnstile) {
    const ok = await verifyTurnstile(req.body.turnstile, ip);
    if (!ok) return res.status(403).end();
  }

  const risk = analyzeSignals(req, behavior);
  if (risk >= 6) return res.status(403).end();

  const payload = {
    ip,
    ua: req.headers["user-agent"],
    nonce: crypto.randomUUID(),
    exp: Date.now() + TRUST_TTL_MS
  };

  const token = sign(payload);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "None",
    secure: true,
    maxAge: TRUST_TTL_MS
  });

  res.json({ ok: true });
});

/* ===========================
   VALIDATE (USED BY MAIN PAGE)
=========================== */
app.post("/validate", (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  const data = verify(token);

  if (!data) return res.json({ ok: false });

  // Bind token to browser
  if (data.ua !== req.headers["user-agent"]) {
    return res.json({ ok: false });
  }

  res.json({
    ok: true,
    token: token // forwarded to VPS step flow
  });
});

/* ===========================
   HEALTH
=========================== */
app.get("/", (_, res) => res.send("Railway Trust Service OK"));

app.listen(PORT, () =>
  console.log("Railway Trust Service running on", PORT)
);
