#!/usr/bin/env node
// Integrity checks for the dashboard. No dependencies. Run: node scripts/validate.mjs
// Exits 1 on any error so CI blocks a broken push.
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mirror = readFileSync(new URL('../cardinal_ln_dashboard.html', import.meta.url), 'utf8');

// 1. Working copy must match the deployed file byte for byte
if (html !== mirror) err('cardinal_ln_dashboard.html differs from index.html. Run: cp index.html cardinal_ln_dashboard.html');

// 2. Inline script must parse
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (scripts.length === 0) err('No inline <script> block found');
scripts.forEach((s, i) => {
  try { new Script(s); } catch (e) { err(`Inline script #${i + 1} does not parse: ${e.message}`); }
});

// 3. Duplicate static ids
const ids = [...html.matchAll(/\sid="([^"$'+]+)"/g)].map((m) => m[1]);
const seen = new Map();
ids.forEach((id) => seen.set(id, (seen.get(id) || 0) + 1));
for (const [id, n] of seen) if (n > 1) err(`Duplicate id="${id}" appears ${n} times`);

// 4. Comp data
const m = html.match(/COMP_DATA\s*=\s*(\{[\s\S]*?\n  \};)/);
if (!m) {
  err('COMP_DATA block not found');
} else {
  let data;
  try { data = new Function('return ' + m[1].replace(/;\s*$/, ''))(); } catch (e) { err('COMP_DATA does not evaluate: ' + e.message); }
  if (data) checkComps(data);
}

function parseDate(s) {
  const p = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(s || '');
  return p ? Date.UTC(2000 + +p[3], +p[1] - 1, +p[2]) : null;
}

function checkRow(r, tab) {
  const tag = `${tab}: ${r.address}`;
  if (!['Locust Lake', 'Arrowhead'].includes(r.community)) err(`${tag} community "${r.community}" is not Locust Lake or Arrowhead`);
  if (!Number.isInteger(r.year) || r.year < 1900 || r.year > 2027) err(`${tag} year built missing or invalid (${r.year})`);
  if (!/^\d+ \/ \d+(\.5)?$/.test(r.bedbath || '')) err(`${tag} bed/bath "${r.bedbath}" not in "N / N" form`);
  if (!(r.sqft > 0)) err(`${tag} sqft missing`);
  if (!(r.price > 0)) err(`${tag} price missing`);
  if (r.sqft > 0 && r.price > 0 && Math.abs(r.psf - r.price / r.sqft) > 1) err(`${tag} psf ${r.psf} does not match price / sqft = ${(r.price / r.sqft).toFixed(1)}`);
  if (!(r.lat > 41.0 && r.lat < 41.3 && r.lng > -75.7 && r.lng < -75.4)) err(`${tag} coordinates outside Pocono Lake area (${r.lat}, ${r.lng})`);
  if (!/^https:\/\/www\.zillow\.com\/home(details|s)\//.test(r.zurl || '')) err(`${tag} Zillow URL missing`);
  else if (!/_zpid\/$/.test(r.zurl)) warn(`${tag} Zillow URL has no zpid, links to a search page`);
}

function checkComps(data) {
  for (const tab of ['active', 'sold']) {
    const rows = data[tab] || [];
    const subj = rows.filter((r) => r.isSubject);
    if (subj.length !== 1 || !rows[0]?.isSubject) err(`${tab}: subject row must appear exactly once, first`);
    const addrs = new Set();
    rows.forEach((r) => {
      if (addrs.has(r.address)) err(`${tab}: duplicate address ${r.address}`);
      addrs.add(r.address);
      checkRow(r, tab);
    });
  }
  const sold = data.sold.filter((r) => !r.isSubject);
  if (sold.length < 20) err(`Only ${sold.length} sold comps, project rule requires at least 20`);
  sold.forEach((r) => {
    const tag = `sold: ${r.address}`;
    if (typeof r.delta !== 'number') { err(`${tag} sold vs ask delta missing`); return; }
    if (!(r.listPrice > 0)) { err(`${tag} listPrice missing`); return; }
    const calc = ((r.price - r.listPrice) / r.listPrice) * 100;
    if (Math.abs(calc - r.delta) > 0.01) err(`${tag} delta ${r.delta} does not match list ${r.listPrice} to sold ${r.price} = ${calc.toFixed(2)}`);
    if (r.dom != null) {
      const a = parseDate(r.listedDate), b = parseDate(r.soldDate);
      if (a == null || b == null) err(`${tag} has DOM but listedDate/soldDate not in M/D/YY form`);
      else if (Math.abs((b - a) / 86400000 - r.dom) > 1) err(`${tag} DOM ${r.dom} does not match ${r.listedDate} to ${r.soldDate} = ${(b - a) / 86400000}`);
    } else warn(`${tag} has no DOM`);
  });
}

warnings.forEach((w) => console.log('warn  ' + w));
errors.forEach((e) => console.log('ERROR ' + e));
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
