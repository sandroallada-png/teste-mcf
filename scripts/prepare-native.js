const fs = require('fs-extra');
const path = require('path');

const ACTIONS_PATH = path.join(__dirname, '../src/app/actions.ts');
const NATIVE_ACTIONS_PATH = path.join(__dirname, '../src/app/actions.native.ts');
const BACKUP_PATH = path.join(__dirname, '../src/app/_actions.backup.ts');

// Dossier (server-routes) — on le renomme avec _ pour que Next.js l'ignore
const SERVER_ROUTES_SRC = path.join(__dirname, '../src/app/(server-routes)');
const SERVER_ROUTES_HIDDEN = path.join(__dirname, '../src/app/_server-routes-hidden');

async function swapForNative() {
    try {
        // ── 1. Actions ──────────────────────────────────────────
        if (fs.existsSync(BACKUP_PATH)) {
            console.warn('Backup _actions.backup.ts ALREADY EXISTS. Aborting.');
            process.exit(1);
        }

        if (fs.existsSync(ACTIONS_PATH)) {
            await fs.move(ACTIONS_PATH, BACKUP_PATH, { overwrite: false });
            console.log('✓ Original actions.ts backed up');
            await fs.copy(NATIVE_ACTIONS_PATH, ACTIONS_PATH);
            console.log('✓ Native actions stub copied to actions.ts');
        }

        // ── 2. Masquer (server-routes) — copie + suppression pour éviter EPERM ──
        if (fs.existsSync(SERVER_ROUTES_HIDDEN)) {
            console.warn('Hidden server routes ALREADY EXISTS. Aborting.');
            process.exit(1);
        }

        if (fs.existsSync(SERVER_ROUTES_SRC)) {
            // Copier vers le dossier caché
            await fs.copy(SERVER_ROUTES_SRC, SERVER_ROUTES_HIDDEN);
            // Vider le contenu sans supprimer le dossier parent (évite EPERM)
            const items = await fs.readdir(SERVER_ROUTES_SRC);
            for (const item of items) {
                await fs.remove(path.join(SERVER_ROUTES_SRC, item));
            }
            // Créer un fichier .gitkeep pour marquer le dossier comme vide
            await fs.writeFile(path.join(SERVER_ROUTES_SRC, '.gitkeep'), '');
            console.log('✓ (server-routes) vidé (exclu du build natif)');
        } else {
            console.warn('(server-routes) not found, skipping...');
        }

    } catch (err) {
        console.error('Error swapping files:', err);
        process.exit(1);
    }
}

swapForNative();
