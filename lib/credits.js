import crypto from "node:crypto";
import { Redis } from "@upstash/redis";
import { normalizeEmail } from "./security";

const redis = Redis.fromEnv();
export const CREDIT_PACK_SIZE = 100;

function creditKey(email) {
  return `credits:${normalizeEmail(email)}`;
}

function codeKey(code) {
  const hash = crypto.createHash("sha256").update((code || "").trim().toUpperCase()).digest("hex");
  return `credit-code:${hash}`;
}

export async function issueCreditCode(email) {
  const normalized = normalizeEmail(email);
  const raw = crypto.randomBytes(9).toString("hex").toUpperCase();
  const code = `VUTU-${raw.slice(0, 6)}-${raw.slice(6, 12)}-${raw.slice(12, 18)}`;
  await redis.set(codeKey(code), `${normalized}|${CREDIT_PACK_SIZE}`, { ex: 60 * 60 * 24 * 30 });
  return code;
}

export async function redeemCreditCode(email, code) {
  const normalized = normalizeEmail(email);
  const value = await redis.eval(
    "local v=redis.call('GET',KEYS[1]); if not v or string.sub(v,1,string.len(ARGV[1])+1)~=ARGV[1]..'|' then return nil end; redis.call('DEL',KEYS[1]); return v",
    [codeKey(code)],
    [normalized],
  );
  if (!value) return null;
  const [issuedEmail, amountText] = String(value).split("|");
  if (issuedEmail !== normalized) return null;
  const amount = Number(amountText);
  const credits = await redis.incrby(creditKey(normalized), amount);
  return { amount, credits };
}

export async function getCredits(email) {
  return Number(await redis.get(creditKey(email))) || 0;
}

export async function reserveCredit(email) {
  const result = await redis.eval(
    "local n=tonumber(redis.call('GET',KEYS[1]) or '0'); if n<=0 then return -1 end; return redis.call('DECR',KEYS[1])",
    [creditKey(email)],
    [],
  );
  return Number(result);
}

export async function refundCredit(email) {
  return Number(await redis.incr(creditKey(email)));
}
