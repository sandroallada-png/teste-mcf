const fs = require('fs-extra');
const path = require('path');

const ACTIONS_PATH = path.join(__dirname, '../src/app/actions.ts');
const BACKUP_PATH = path.join(__dirname, '../src/app/_actions.backup.ts');

const SERVER_ROUTES_SRC = path.join(__dirname, '../src/app/(server-routes)');
const SERVER_ROUTES_HIDDEN = path.join(__dirname, '../src/app/_server-routes-hidden');

async function restoreOriginal() {
    try {
        // ── 1. Restaurer actions.ts ──────────────────────────────
        if (fs.existsSync(BACKUP_PATH)) {
            if (fs.existsSync(ACTIONS_PATH)) await fs.remove(ACTIONS_PATH);
            await fs.move(BACKUP_PATH, ACTIONS_PATH);
            console.log('✓ Original actions.ts restored from backup');
        } else {
            console.warn('Backup _actions.backup.ts not found! Cannot restore.');
        }

        // ── 2. Restaurer le contenu de (server-routes) ────────────
        if (fs.existsSync(SERVER_ROUTES_HIDDEN)) {
            // Supprimer le .gitkeep et tout contenu temporaire
            const currentItems = await fs.readdir(SERVER_ROUTES_SRC);
            for (const item of currentItems) {
                await fs.remove(path.join(SERVER_ROUTES_SRC, item));
            }
            // Copier le contenu sauvegardé
            const items = await fs.readdir(SERVER_ROUTES_HIDDEN);
            for (const item of items) {
                await fs.copy(
                    path.join(SERVER_ROUTES_HIDDEN, item),
                    path.join(SERVER_ROUTES_SRC, item)
                );
            }
            // Supprimer la sauvegarde
            await fs.remove(SERVER_ROUTES_HIDDEN);
            console.log('✓ (server-routes) contenu restauré');
        } else {
            console.warn('Server routes backup not found, skipping restore...');
        }

        // ── 3. Restaurer next.config.ts ──
        const nextConfigPath = path.join(__dirname, '../next.config.ts');
        const nextConfigBackupPath = nextConfigPath + '.backup';
        if (fs.existsSync(nextConfigBackupPath)) {
            await fs.copy(nextConfigBackupPath, nextConfigPath, { overwrite: true });
            await fs.remove(nextConfigBackupPath);
            console.log('✓ next.config.ts restauré à son état dynamique (Vercel-ready)');
        }

    } catch (err) {
        console.error('Error restoring files:', err);
        process.exit(1);
    }
}

restoreOriginal();
