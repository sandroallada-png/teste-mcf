# 📖 MCF iOS — Dépôt de Build Local

Ce dépôt reçoit le projet iOS **prêt à compiler** généré depuis le dépôt principal [`mcf`](https://github.com/sandroallada-png/mcf).

> **Ce dépôt ne contient pas le code source Next.js.** Seulement ce qu'il faut pour Xcode.

---

## ⚙️ Prérequis (sur le Mac)

- **Xcode 14+** (recommandé : le plus récent possible)
- **Node.js 20+** (`brew install node`)
- **CocoaPods** : `sudo gem install cocoapods`
- **Capacitor CLI** : `npm install -g @capacitor/cli`

---

## 🚀 Workflow Complet

### Étape 1 — Sur le PC Windows (dépôt `mcf`)

```bash
# 1. Préparer + builder + synchroniser (tout en une commande)
npm run build:ios-native

# OU étape par étape :
node scripts/prepare-ios.js    # masque les routes serveur, configure export statique
npm run build                  # génère le dossier dist/
npx cap sync ios               # copie dist/ dans ios/App/public/
node scripts/restore-ios.js    # restaure le projet pour Vercel
```

### Étape 2 — Pousser vers ce dépôt

```bash
cd ios/                # on ne pousse QUE le dossier ios/
git add -A
git commit -m "chore: sync ios build"
git push
```

### Étape 3 — Sur le Mac

```bash
# Cloner ce dépôt
git clone https://github.com/sandroallada-png/mcf-ios.git
cd mcf-ios

# Installer les dépendances Node (pour Capacitor CLI)
npm install

# Ouvrir dans Xcode
npx cap open ios
```

---

## 🔍 Déboguer l'Écran Blanc

Si l'application affiche un **écran blanc** dans le simulateur ou sur un iPhone réel :

1. Lancer l'application depuis Xcode
2. Ouvrir **Safari** sur le Mac
3. Menu **Développement** → nom du simulateur/iPhone → **My Cook Flex**
4. Les **erreurs JavaScript** apparaissent en rouge dans la console

> [!TIP]
> C'est exactement comme `adb logcat` sur Android ou l'inspecteur de Chrome DevTools.

---

## 📁 Architecture du dépôt

```
mcf-ios/
├── App/                     ← Projet Xcode
│   ├── App/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   ├── GoogleService-Info.plist
│   │   ├── capacitor.config.json  ← Config iOS locale (webDir: dist)
│   │   └── public/              ← Fichiers web compilés (dist/)
│   ├── App.xcodeproj/
│   └── CapApp-SPM/          ← Packages Swift (Capacitor plugins)
├── package.json             ← npm install pour Capacitor CLI
└── README.md
```

---

## ⚠️ Différences vs mode Production (Appflow)

| | Build Local (ce dépôt) | Build Appflow (production) |
|:---|:---:|:---:|
| Source web | `dist/` embarqué | `https://app.mycookflex.com` |
| Visible dans Xcode | ✅ Oui | ❌ Non |
| Erreurs JS | ✅ Dans Safari Mac | ❌ Difficile à voir |
| Mise à jour sans publish | ❌ Non | ✅ Oui (URL distante) |

---

## 🔐 Certificats (pour submission App Store)

Les certificats ne sont **pas** dans ce dépôt.  
Team ID : `KV825CMDG7` — Setondji Maxy Djisso

Pour le débogage local : utiliser **Automatic Signing** dans Xcode (votre compte Apple dev personnel suffit pour le simulateur).
