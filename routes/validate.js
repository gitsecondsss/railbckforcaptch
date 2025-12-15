import { verifyToken } from "../security/trustToken.js";

export default async function validate(req, res) {
  try {
    const { token } = req.body;
    const valid = verifyToken(token);

    if (!valid) return res.status(403).json({ ok: false, error: "Invalid or expired token" });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
