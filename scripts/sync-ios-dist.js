/**
 * sync-ios-dist.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Copie le build statique (dist/) vers le dépôt iOS autonome (mcf-ios-dist).
 * Équivalent du `mcf:android` qui génère un APK dans le dossier android/.
 *
 * Usage :
 *   node scripts/sync-ios-dist.js
 *
 * Ce script est appelé automatiquement par : npm run build:ios-native
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs-extra');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const DIST_SRC    = path.join(ROOT, 'out');
const IOS_REPO    = path.join(ROOT, '..', 'mcf-ios-dist');
const IOS_PUBLIC  = path.join(IOS_REPO, 'ios', 'App', 'public');

async function main() {
  console.log('\n📦  MCF — Sync build web → dépôt iOS\n');

  // ── Vérifications ─────────────────────────────────────────────────────────
  if (!fs.existsSync(DIST_SRC)) {
    console.error('❌  Le dossier dist/ est introuvable.');
    console.error('    Lancez d\'abord : npm run build');
    process.exit(1);
  }

  if (!fs.existsSync(IOS_REPO)) {
    console.error(`❌  Le dépôt iOS introuvable : ${IOS_REPO}`);
    console.error('    Clonez mcf-ios-dist dans MCF-works/ :');
    console.error('    git clone https://github.com/sandroallada-png/mcf-ios.git mcf-ios-dist');
    process.exit(1);
  }

  // ── Nettoyage et copie ────────────────────────────────────────────────────
  console.log(`  Source  : ${DIST_SRC}`);
  console.log(`  Cible   : ${IOS_PUBLIC}`);

  if (fs.existsSync(IOS_PUBLIC)) {
    await fs.emptyDir(IOS_PUBLIC);
    console.log('  ✓ Ancien build supprimé');
  } else {
    await fs.mkdirp(IOS_PUBLIC);
    console.log('  ✓ Dossier public/ créé');
  }

  await fs.copy(DIST_SRC, IOS_PUBLIC);
  console.log('  ✓ Web build copié');

  // ── Exclusion de la section ADMIN (Sécurité iPhone) ───────────────────────
  const ADMIN_PATH = path.join(IOS_PUBLIC, 'admin');
  if (fs.existsSync(ADMIN_PATH)) {
    await fs.remove(ADMIN_PATH);
    console.log('  ✓ Section Admin exclue du build natif');
  }
  console.log('  ✓ Web build copié');

  // ── Copie de la config Capacitor ──────────────────────────────────────────
  const CONFIG_FILE = 'capacitor.config.ts';
  if (fs.existsSync(path.join(ROOT, CONFIG_FILE))) {
    await fs.copy(path.join(ROOT, CONFIG_FILE), path.join(IOS_REPO, CONFIG_FILE));
    console.log(`  ✓ ${CONFIG_FILE} synchronisé`);
  }

  // Compter les fichiers copiés
  const files = await fs.readdir(IOS_PUBLIC);
  console.log(`  ✓ ${files.length} éléments copiés dans public/`);

  console.log(`
✅  Sync terminée !

Prochaines étapes :
  cd ..\\mcf-ios-dist
  git add App/App/public/
  git commit -m "chore: web build $(date +%Y-%m-%d)"
  git push

Sur le Mac :
  git pull
  → Xcode recharge les fichiers automatiquement
`);
}

main().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
