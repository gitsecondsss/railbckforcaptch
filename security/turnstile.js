import fetch from "node-fetch";
import { TURNSTILE_SECRET } from "../config/constants.js";

export async function verifyTurnstile(token) {
  if (!token) return false;
  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${TURNSTILE_SECRET}&response=${token}`
  });
  const data = await resp.json();
  return data.success === true;
}
