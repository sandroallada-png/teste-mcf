/**
 * prepare-ios.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Prépare le projet pour un build iOS natif (local Mac / dépôt mcf-ios).
 *
 * Ce script :
 *  1. Sauvegarde actions.ts  → _actions.backup.ts
 *  2. Injecte actions.native.ts  (stubs sans Server Actions)
 *  3. Masque (server-routes) et api/  (routes Next.js incompatibles avec export statique)
 *  4. Configure next.config.ts pour output:'export' + distDir:'dist'
 *  5. Sauvegarde capacitor.config.ts et injecte la version iOS locale
 *     (sans l'URL distante : l'app charge dist/ en local pour le débogage)
 *
 * Usage :
 *   node scripts/prepare-ios.js
 *   → puis : npm run build
 *   → puis : npx cap sync ios
 *
 * Restauration :
 *   node scripts/restore-ios.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs-extra');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const ACTIONS_PATH         = path.join(ROOT, 'src/app/actions.ts');
const NATIVE_ACTIONS_PATH  = path.join(ROOT, 'src/app/actions.native.ts');
const ACTIONS_BACKUP       = path.join(ROOT, 'src/app/_actions.backup.ts');

const SERVER_ROUTES_SRC    = path.join(ROOT, 'src/app/(server-routes)');
const SERVER_ROUTES_HIDDEN = path.join(ROOT, 'src/app/_server-routes-hidden');

const API_SRC              = path.join(ROOT, 'src/app/api');
const API_HIDDEN           = path.join(ROOT, 'src/app/_api-hidden');

const NEXT_CONFIG          = path.join(ROOT, 'next.config.ts');
const NEXT_CONFIG_BACKUP   = NEXT_CONFIG + '.ios-backup';

const CAP_CONFIG           = path.join(ROOT, 'capacitor.config.ts');
const CAP_CONFIG_BACKUP    = CAP_CONFIG + '.ios-backup';

// ── Contenu de capacitor.config.ts pour le build iOS local ───────────────────
// Pas d'URL distante → l'app charge out/ embarqué (mode hors-ligne / debug)
const CAP_CONFIG_IOS_LOCAL = `import { CapacitorConfig } from '@capacitor/cli';
// MCF iOS LOCAL BUILD — généré par scripts/prepare-ios.js
// NE PAS COMMITER CE FICHIER tel quel (il est temporaire)

const config: CapacitorConfig = {
  appId: 'my.cook.flex',
  appName: 'My Cook Flex',
  webDir: 'out',          // ← pointe vers le dossier d'export statique
  // PAS de server.url → WebView charge les fichiers locaux (out/)
  // Cela permet de voir les vraies erreurs JS dans la console Xcode / Safari
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#f97316',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    }
  }
};

export default config;
`;

async function main() {
  console.log('\n🍎  MCF — Préparation du build iOS LOCAL\n');

  // ── Garde-fous ────────────────────────────────────────────────────────────
  if (fs.existsSync(ACTIONS_BACKUP)) {
    console.error('❌  _actions.backup.ts existe déjà. Lancez d\'abord :\n   node scripts/restore-ios.js');
    process.exit(1);
  }
  if (fs.existsSync(SERVER_ROUTES_HIDDEN)) {
    console.error('❌  _server-routes-hidden existe déjà. Lancez d\'abord :\n   node scripts/restore-ios.js');
    process.exit(1);
  }

  // ── 1. actions.ts ─────────────────────────────────────────────────────────
  if (fs.existsSync(ACTIONS_PATH)) {
    await fs.move(ACTIONS_PATH, ACTIONS_BACKUP, { overwrite: false });
    console.log('  ✓ actions.ts sauvegardé → _actions.backup.ts');
    if (fs.existsSync(NATIVE_ACTIONS_PATH)) {
      await fs.copy(NATIVE_ACTIONS_PATH, ACTIONS_PATH);
      console.log('  ✓ actions.native.ts copié vers actions.ts (stubs sans Server Actions)');
    } else {
      // Créer un stub minimal si le fichier natif n'existe pas encore
      await fs.writeFile(ACTIONS_PATH, `// Stub iOS — les Server Actions tournent sur Vercel\nexport {};\n`);
      console.log('  ✓ Stub actions.ts créé (actions.native.ts introuvable)');
    }
  }

  // ── 2. Masquer (server-routes) ────────────────────────────────────────────
  if (fs.existsSync(SERVER_ROUTES_SRC)) {
    await fs.copy(SERVER_ROUTES_SRC, SERVER_ROUTES_HIDDEN);
    const items = await fs.readdir(SERVER_ROUTES_SRC);
    for (const item of items) {
      await fs.remove(path.join(SERVER_ROUTES_SRC, item));
    }
    await fs.writeFile(path.join(SERVER_ROUTES_SRC, '.gitkeep'), '');
    console.log('  ✓ (server-routes) masqué');
  } else {
    console.warn('  ⚠  (server-routes) introuvable, ignoré.');
  }

  // ── 3. Masquer api/ ───────────────────────────────────────────────────────
  if (fs.existsSync(API_SRC)) {
    await fs.copy(API_SRC, API_HIDDEN);
    const items = await fs.readdir(API_SRC);
    for (const item of items) {
      await fs.remove(path.join(API_SRC, item));
    }
    await fs.writeFile(path.join(API_SRC, '.gitkeep'), '');
    console.log('  ✓ api/ masqué');
  }

  // ── 4. next.config.ts → export statique ──────────────────────────────────
  if (fs.existsSync(NEXT_CONFIG)) {
    let cfg = await fs.readFile(NEXT_CONFIG, 'utf8');
    await fs.writeFile(NEXT_CONFIG_BACKUP, cfg);

    if (!cfg.includes("output: 'export'")) {
      cfg = cfg.replace(
        "const nextConfig: NextConfig = {",
        "const nextConfig: NextConfig = {\n  output: 'export',"
      );
      await fs.writeFile(NEXT_CONFIG, cfg);
      console.log("  ✓ next.config.ts → output:'export'");
    } else {
      console.log("  ✓ next.config.ts déjà en mode export (inchangé)");
    }
  }

  // ── 5. capacitor.config.ts → version iOS locale ───────────────────────────
  if (fs.existsSync(CAP_CONFIG)) {
    await fs.copy(CAP_CONFIG, CAP_CONFIG_BACKUP);
    await fs.writeFile(CAP_CONFIG, CAP_CONFIG_IOS_LOCAL);
    console.log('  ✓ capacitor.config.ts → mode iOS LOCAL (sans URL distante)');
  }

  console.log(`
✅  Préparation terminée !

Prochaines étapes sur ce PC Windows :
  1. npm run build               (génère dist/)
  2. npx cap sync ios            (copie dist/ dans ios/)

Prochaines étapes sur le Mac :
  3. git pull (depuis mcf-ios)
  4. npm install
  5. npx cap open ios
  → Xcode s'ouvre, lancer le simulateur
  → Sur Mac : Safari > Développement > Simulateur > My Cook Flex
  → Les erreurs JS apparaissent clairement dans la console Safari

Restauration (après le build) :
  node scripts/restore-ios.js
`);
}

main().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
