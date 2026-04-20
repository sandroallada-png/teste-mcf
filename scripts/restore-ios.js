/**
 * restore-ios.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Restaure l'état du projet après un build iOS (inverse de prepare-ios.js).
 *
 * Ce script :
 *  1. Restaure actions.ts depuis _actions.backup.ts
 *  2. Restaure (server-routes) et api/
 *  3. Restaure next.config.ts (mode Vercel / Next.js dynamique)
 *  4. Restaure capacitor.config.ts (mode Hybrid avec URL distante)
 *
 * Usage :
 *   node scripts/restore-ios.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs-extra');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const ACTIONS_PATH         = path.join(ROOT, 'src/app/actions.ts');
const ACTIONS_BACKUP       = path.join(ROOT, 'src/app/_actions.backup.ts');

const SERVER_ROUTES_SRC    = path.join(ROOT, 'src/app/(server-routes)');
const SERVER_ROUTES_HIDDEN = path.join(ROOT, 'src/app/_server-routes-hidden');

const API_SRC              = path.join(ROOT, 'src/app/api');
const API_HIDDEN           = path.join(ROOT, 'src/app/_api-hidden');

const NEXT_CONFIG          = path.join(ROOT, 'next.config.ts');
const NEXT_CONFIG_BACKUP   = NEXT_CONFIG + '.ios-backup';

const CAP_CONFIG           = path.join(ROOT, 'capacitor.config.ts');
const CAP_CONFIG_BACKUP    = CAP_CONFIG + '.ios-backup';

async function main() {
  console.log('\n🔄  MCF — Restauration après build iOS\n');

  // ── 1. Restaurer actions.ts ───────────────────────────────────────────────
  if (fs.existsSync(ACTIONS_BACKUP)) {
    if (fs.existsSync(ACTIONS_PATH)) await fs.remove(ACTIONS_PATH);
    await fs.move(ACTIONS_BACKUP, ACTIONS_PATH);
    console.log('  ✓ actions.ts restauré depuis _actions.backup.ts');
  } else {
    console.warn('  ⚠  _actions.backup.ts introuvable, actions.ts non restauré.');
  }

  // ── 2. Restaurer (server-routes) ─────────────────────────────────────────
  if (fs.existsSync(SERVER_ROUTES_HIDDEN)) {
    const currentItems = await fs.readdir(SERVER_ROUTES_SRC);
    for (const item of currentItems) {
      await fs.remove(path.join(SERVER_ROUTES_SRC, item));
    }
    const items = await fs.readdir(SERVER_ROUTES_HIDDEN);
    for (const item of items) {
      await fs.copy(
        path.join(SERVER_ROUTES_HIDDEN, item),
        path.join(SERVER_ROUTES_SRC, item)
      );
    }
    await fs.remove(SERVER_ROUTES_HIDDEN);
    console.log('  ✓ (server-routes) restauré');
  } else {
    console.warn('  ⚠  _server-routes-hidden introuvable, ignoré.');
  }

  // ── 3. Restaurer api/ ─────────────────────────────────────────────────────
  if (fs.existsSync(API_HIDDEN)) {
    const currentItems = await fs.readdir(API_SRC);
    for (const item of currentItems) {
      await fs.remove(path.join(API_SRC, item));
    }
    const items = await fs.readdir(API_HIDDEN);
    for (const item of items) {
      await fs.copy(
        path.join(API_HIDDEN, item),
        path.join(API_SRC, item)
      );
    }
    await fs.remove(API_HIDDEN);
    console.log('  ✓ api/ restauré');
  }

  // ── 4. Restaurer next.config.ts ───────────────────────────────────────────
  if (fs.existsSync(NEXT_CONFIG_BACKUP)) {
    await fs.copy(NEXT_CONFIG_BACKUP, NEXT_CONFIG, { overwrite: true });
    await fs.remove(NEXT_CONFIG_BACKUP);
    console.log('  ✓ next.config.ts restauré (mode Vercel dynamique)');
  } else {
    console.warn('  ⚠  next.config.ts.ios-backup introuvable, ignoré.');
  }

  // ── 5. Restaurer capacitor.config.ts ──────────────────────────────────────
  if (fs.existsSync(CAP_CONFIG_BACKUP)) {
    await fs.copy(CAP_CONFIG_BACKUP, CAP_CONFIG, { overwrite: true });
    await fs.remove(CAP_CONFIG_BACKUP);
    console.log('  ✓ capacitor.config.ts restauré (mode Hybrid + URL distante)');
  } else {
    console.warn('  ⚠  capacitor.config.ts.ios-backup introuvable, ignoré.');
  }

  console.log('\n✅  Restauration terminée. Le projet est prêt pour Vercel.\n');
}

main().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
