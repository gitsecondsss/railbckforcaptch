export default function health(req, res) {
  res.json({ ok: true, status: "Railway backend up" });
}
