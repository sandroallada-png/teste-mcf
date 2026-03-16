/**
 * Script de génération d'icônes Android depuis public/mcf-logo.png
 * Redimensionne l'image vers tous les formats mipmap requis
 * Usage: node scripts/generate-android-icons.js
 */

const fs = require('fs-extra');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '../public/new-logo/logo-favicon.png');
const ANDROID_RES = path.join(__dirname, '../android/app/src/main/res');

const SIZES = [
    { folder: 'mipmap-ldpi', size: 36 },
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 },
];

async function generateIcons() {
    // Vérifier que sharp est disponible
    let sharp;
    try {
        sharp = require('sharp');
    } catch (e) {
        console.log('📦 Installation de sharp...');
        const { execSync } = require('child_process');
        execSync('npm install --save-dev sharp', { stdio: 'inherit' });
        sharp = require('sharp');
    }

    if (!fs.existsSync(SOURCE_ICON)) {
        console.error(`❌ Source icon not found: ${SOURCE_ICON}`);
        process.exit(1);
    }

    console.log(`🎨 Génération des icônes depuis: ${SOURCE_ICON}`);

    for (const { folder, size } of SIZES) {
        const destFolder = path.join(ANDROID_RES, folder);
        await fs.ensureDir(destFolder);

        // ic_launcher.png (icône principale)
        await sharp(SOURCE_ICON)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toFile(path.join(destFolder, 'ic_launcher.png'));

        // ic_launcher_round.png (icône ronde)
        await sharp(SOURCE_ICON)
            .resize(size, size, { fit: 'cover' })
            .png()
            .toFile(path.join(destFolder, 'ic_launcher_round.png'));

        // ic_launcher_foreground.png (foreground layer)
        await sharp(SOURCE_ICON)
            .resize(Math.round(size * 1.4), Math.round(size * 1.4), {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .resize(Math.round(size * 1.4), Math.round(size * 1.4))
            .png()
            .toFile(path.join(destFolder, 'ic_launcher_foreground.png'));

        console.log(`  ✓ ${folder} (${size}x${size}px)`);
    }

    console.log('\n✅ Icônes générées avec succès !');
    console.log('👉 Rebuild l\'APK dans Android Studio pour voir les changements.');
}

generateIcons().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
});
