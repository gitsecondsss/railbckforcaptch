import { verifyTurnstile } from "../security/turnstile.js";
import { generateToken } from "../security/trustToken.js";
import { scoreBehavior } from "../security/score.js";

export default async function issue(req, res) {
  try {
    const { token, behavior } = req.body;

    // 1. Verify Cloudflare Turnstile
    const turnstileOk = await verifyTurnstile(token);
    if (!turnstileOk) return res.status(403).json({ ok: false, error: "Turnstile validation failed" });

    // 2. Passive behavior scoring
    const behaviorObj = behavior ? JSON.parse(behavior) : {};
    const trustScore = scoreBehavior(behaviorObj);

    // 3. Issue short-lived signed token
    const trustToken = generateToken(trustScore);

    return res.json({ ok: true, token: trustToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
