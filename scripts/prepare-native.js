const fs = require('fs-extra');
const path = require('path');

const ACTIONS_PATH = path.join(__dirname, '../src/app/actions.ts');
const NATIVE_ACTIONS_PATH = path.join(__dirname, '../src/app/actions.native.ts');
const BACKUP_PATH = path.join(__dirname, '../src/app/_actions.backup.ts');

// Dossier (server-routes) — on le renomme avec _ pour que Next.js l'ignore
const SERVER_ROUTES_SRC = path.join(__dirname, '../src/app/(server-routes)');
const SERVER_ROUTES_HIDDEN = path.join(__dirname, '../src/app/_server-routes-hidden');

const API_SRC = path.join(__dirname, '../src/app/api');
const API_HIDDEN = path.join(__dirname, '../src/app/_api-hidden');

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

        // ── 3. Masquer api — copie + suppression ──
        if (fs.existsSync(API_HIDDEN)) {
            console.warn('Hidden API ALREADY EXISTS. Aborting.');
            process.exit(1);
        }

        if (fs.existsSync(API_SRC)) {
            await fs.copy(API_SRC, API_HIDDEN);
            const items = await fs.readdir(API_SRC);
            for (const item of items) {
                await fs.remove(path.join(API_SRC, item));
            }
            await fs.writeFile(path.join(API_SRC, '.gitkeep'), '');
            console.log('✓ api vidé (exclu du build natif)');
        }

        // ── 3. Injecter la configuration statique pour Capacitor ──
        const nextConfigPath = path.join(__dirname, '../next.config.ts');
        if (fs.existsSync(nextConfigPath)) {
            let configStr = await fs.readFile(nextConfigPath, 'utf8');
            await fs.writeFile(nextConfigPath + '.backup', configStr);

            if (!configStr.includes("output: 'export'")) {
                configStr = configStr.replace(
                    "const nextConfig: NextConfig = {",
                    "const nextConfig: NextConfig = {\n  output: 'export',\n  distDir: 'dist',"
                );
                await fs.writeFile(nextConfigPath, configStr);
                console.log("✓ next.config.ts paramétré pour l'export statique");
            }
        }

    } catch (err) {
        console.error('Error swapping files:', err);
        process.exit(1);
    }
}

swapForNative();
