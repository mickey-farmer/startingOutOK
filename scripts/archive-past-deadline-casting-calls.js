#!/usr/bin/env node
/**
 * Sets archived: true on casting calls in content/casting-calls/ whose
 * auditionDeadline is in the past (compared to today in UTC).
 * Only modifies files that are not already archived.
 * Used by GitHub Actions to auto-archive expired casting calls.
 *
 * Usage: node scripts/archive-past-deadline-casting-calls.js
 * Exits 0. The workflow detects changes via git status.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const castingDir = path.join(ROOT, "content", "casting-calls");

function todayUTC() {
  const d = new Date();
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}

function isPastDeadline(deadlineStr) {
  if (!deadlineStr || typeof deadlineStr !== "string") return false;
  const today = todayUTC();
  return deadlineStr < today;
}

function isAlreadyArchived(obj) {
  return obj.archived === true || obj.archived === "true";
}

function main() {
  if (!fs.existsSync(castingDir)) {
    console.log("No content/casting-calls folder, nothing to do.");
    process.exit(0);
  }

  const files = fs.readdirSync(castingDir).filter((f) => f.endsWith(".json"));
  let updated = 0;

  for (const file of files) {
    const filePath = path.join(castingDir, file);
    let obj;
    try {
      obj = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      console.warn("Skip invalid JSON:", filePath, e.message);
      continue;
    }
    if (!obj || typeof obj !== "object") continue;
    if (isAlreadyArchived(obj)) continue;
    if (!isPastDeadline(obj.auditionDeadline)) continue;

    obj.archived = true;
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
    console.log("Archived (deadline passed):", obj.slug || file);
    updated++;
  }

  if (updated > 0) {
    console.log("Updated", updated, "casting call(s).");
  } else {
    console.log("No casting calls needed archiving.");
  }
  process.exit(0);
}

main();
