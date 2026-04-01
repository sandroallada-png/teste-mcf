Package Build #10
Failed
Rerun build
Running with gitlab-runner 14.10.1/1.6.1 (029651c8)
  on ANKA_RUNNER 161fa1c3
Preparing the "anka" executor
Opening a connection to the Anka Cloud Controller: https://controller.green.us-west-2.apple-orchard.net:443
Starting Anka VM using:
  - VM Template UUID: a2cafd4d-8237-47b3-83dc-47fdd53d37aa
  - VM Template Tag Name: v1
Please be patient...
You can check the status of starting your Instance on the Anka Cloud Controller: https://controller.green.us-west-2.apple-orchard.net:443/#/instances
Verifying connectivity to the VM: build_stack_2026.01_arm64-1775050998813572000 (056f96fc-7718-4c4f-aa0b-d9c9abb899be) | Controller Instance ID: 765892e1-e6da-46fd-604d-11a85a6c4063 | Host: 10.2.164.196 | Port: 10001 
VM "build_stack_2026.01_arm64-1775050998813572000" (056f96fc-7718-4c4f-aa0b-d9c9abb899be) / Controller Instance ID 765892e1-e6da-46fd-604d-11a85a6c4063 running on Node ip-10-2-164-196.us-west-2.compute.internal (10.2.164.196), is ready for work (10.2.164.196:10001)
Preparing environment
Running on ip-192-168-64-23.us-west-2.compute.internal via ip-10-2-129-215.us-west-2.compute.internal...
Getting source from Git repository
$ pre-clone
[13:44:05]: Cloning repository...
Fetching changes...
Initialized empty Git repository in /Users/ionic-cloud-team/builds/sandroallada-png/mcf/.git/
Created fresh repository.
failed to store: -25308
Checking out 21027c09 as main...
Updating/initializing submodules...
$ post-clone
[13:44:08]: Cloning complete...
Executing "step_script" stage of the job script
$ pre-build
[13:44:08]: Building project....
$ fetch-updates || true
Checking for build process updates...
$ build-ios
Top level ::CompositeIO is deprecated, require 'multipart/post' and use `Multipart::Post::CompositeReadIO` instead!
Top level ::Parts is deprecated, require 'multipart/post' and use `Multipart::Post::Parts` instead!
[13:44:13]: ---------------------------------
[13:44:13]: --- Step: add_extra_platforms ---
[13:44:13]: ---------------------------------
[13:44:13]: Setting '[:web]' as extra SupportedPlatforms
[13:44:13]: ------------------------------
[13:44:13]: --- Step: default_platform ---
[13:44:13]: ------------------------------
[13:44:13]: Driving the lane 'ios build_capacitor' 🚀
[13:44:13]: ---------------------------------
[13:44:13]: --- Step: prepare_environment ---
[13:44:13]: ---------------------------------
[13:44:13]: Setting default environment variables to tidy up logs. These can be overridden by setting them in Appflow.
[13:44:13]: 
[13:44:13]: No changes needed - logs are already tidy! 🧹
[13:44:13]: -------------------------
[13:44:13]: --- Step: sentry_init ---
[13:44:13]: -------------------------
[13:44:13]: ----------------------------
[13:44:13]: --- Step: begin_building ---
[13:44:13]: ----------------------------
[13:44:13]: Began building @ 2026-04-01T13:44:13
[13:44:13]: ---------------------------
[13:44:13]: --- Step: build_summary ---
[13:44:13]: ---------------------------

+---------------------------------------------------+
|                   Build Summary                   |
+---------------------+-----------------------------+
| Runners Revision    | 4926248                     |
| Job ID              | 10840000                    |
| Node.js version     | v22.22.0                    |
| Cordova CLI version | 12.0.0 (cordova-lib@12.0.2) |
| npm version         | 10.9.4                      |
| yarn version        | 1.22.19                     |
| macOS version       | 15.6                        |
| Xcode version       | Xcode 26.2                  |
|                     | Build version 17C52         |
| Fastlane version    | fastlane (2.230.0)          |
+---------------------+-----------------------------+

[13:44:18]: -----------------------------
[13:44:18]: --- Step: create_keychain ---
[13:44:18]: -----------------------------
[13:44:18]: $ security list-keychains -d user
[13:44:18]: ▸ "/Users/ionic-cloud-team/Library/Keychains/login.keychain-db"
[13:44:18]: ------------------------------------------
[13:44:18]: --- Step: get_ios_credentials_from_api ---
[13:44:18]: ------------------------------------------
[13:44:18]: Fetching certificate and profile(s) from Ionic Appflow
[13:44:19]: ---------------------------------
[13:44:19]: --- Step: set_ios_credentials ---
[13:44:19]: ---------------------------------
[13:44:19]: Installing provisioning profile...
[13:44:20]: /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ca5009a3-c2f6-4a05-b7f1-1b719a43c05e.mobileprovision

+----------------------------------------------------------------------------+
|                           Installed Certificate                            |
+-------------------+--------------------------------------------------------+
| User ID           | KV825CMDG7                                             |
| Common Name       | iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7) |
| Organization Unit | KV825CMDG7                                             |
| Organization      | Setondji Maxy Djisso                                   |
| Country           | FR                                                     |
+-------------------+--------------------------------------------------------+

[13:44:20]: --------------------------------
[13:44:20]: --- Step: import_certificate ---
[13:44:20]: --------------------------------
[13:44:20]: Setting key partition list... (this can take a minute if there are a lot of keys installed)
[13:44:20]: ---------------------------
[13:44:20]: --- Step: set_ionic_cli ---
[13:44:20]: ---------------------------
[13:44:22]: Preinstalled @ionic/cli compatible with project `custom`
[13:44:22]: ------------------------------------
[13:44:22]: --- Step: detect_package_manager ---
[13:44:22]: ------------------------------------
[13:44:22]: Detecting package manager
[13:44:22]: Defaulting to npm
[13:44:22]: ---------------------------------
[13:44:22]: --- Step: add_git_credentials ---
[13:44:22]: ---------------------------------
[13:44:22]: Writing git-credentials files
[13:44:22]: git-credentials successfully added to project
[13:44:22]: --------------------------------
[13:44:22]: --- Step: get_appflow_config ---
[13:44:22]: --------------------------------
[13:44:22]: Checking for appflow.config.json
[13:44:22]: Appflow config not detected
[13:44:22]: --------------------------------
[13:44:22]: --- Step: dependency_install ---
[13:44:22]: --------------------------------
[13:44:22]: Installing Dependencies (in /Users/ionic-cloud-team/builds/sandroallada-png/mcf)
[13:44:22]: $ npm ci --quiet 
[13:44:23]: ▸ npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[13:44:23]: ▸ npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
[13:44:23]: ▸ npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[13:44:23]: ▸ npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[13:44:23]: ▸ npm warn deprecated q@1.5.1: You or someone you depend on is using Q, the JavaScript Promise library that gave JavaScript developers strong feelings about promises. They can almost certainly migrate to the native JavaScript promise now. Thank you literally everyone for joining me in this bet against the odds. Be excellent to each other.
[13:44:23]: ▸ npm warn deprecated
[13:44:23]: ▸ npm warn deprecated (For a CapTP with native promises, see @endo/eventual-send and @endo/captp)
[13:44:24]: ▸ npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
[13:44:25]: ▸ npm warn deprecated tar@6.2.1: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[13:44:25]: ▸ npm warn deprecated @types/xlsx@0.0.36: This is a stub types definition for xlsx (https://github.com/sheetjs/js-xlsx). xlsx provides its own type definitions, so you don't need @types/xlsx installed!
[13:44:27]: ▸ npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*
[13:44:27]: ▸ npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*
[13:44:28]: ▸ npm warn deprecated glob@9.3.5: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[13:44:51]: ▸ added 982 packages, and audited 983 packages in 30s
[13:44:51]: ▸ 186 packages are looking for funding
[13:44:51]: ▸ run `npm fund` for details
[13:44:51]: ▸ 22 vulnerabilities (2 low, 5 moderate, 14 high, 1 critical)
[13:44:51]: ▸ To address issues that do not require attention, run:
[13:44:51]: ▸ npm audit fix
[13:44:51]: ▸ To address all issues possible (including breaking changes), run:
[13:44:51]: ▸ npm audit fix --force
[13:44:51]: ▸ Some issues need review, and may require choosing
[13:44:51]: ▸ a different dependency.
[13:44:51]: ▸ Run `npm audit` for details.
[13:44:51]: -------------------------------------
[13:44:51]: --- Step: create_capacitor_config ---
[13:44:51]: -------------------------------------
[13:44:53]: Created capacitor.config.json from capacitor.config.ts/js
[13:44:53]: ----------------------------------------
[13:44:53]: --- Step: detect_ios_package_manager ---
[13:44:53]: ----------------------------------------
[13:44:53]: Detected SPM project (found /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/CapApp-SPM)
[13:44:53]: Detected iOS package manager: spm
[13:44:53]: -------------------------
[13:44:53]: --- Step: get_web_dir ---
[13:44:53]: -------------------------
[13:44:53]: webDir is `dist`
[13:44:53]: -----------------------------------
[13:44:53]: --- Step: modify_cap_web_config ---
[13:44:53]: -----------------------------------
[13:44:53]: No custom native config detected.
[13:44:53]: ---------------------------
[13:44:53]: --- Step: build_pro_app ---
[13:44:53]: ---------------------------
[13:44:53]: Building app from /Users/ionic-cloud-team/builds/sandroallada-png/mcf
[13:44:53]: Build script detected...
[13:44:53]: $ npm run build
[13:44:53]: ▸ > my-cook-flex@0.1.0 build
[13:44:53]: ▸ > next build
[13:44:54]: ▸ ⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
[13:44:54]: ▸ Attention: Next.js now collects completely anonymous telemetry regarding usage.
[13:44:54]: ▸ This information is used to shape Next.js' roadmap and prioritize features.
[13:44:54]: ▸ You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[13:44:54]: ▸ https://nextjs.org/telemetry
[13:44:54]: ▸ ▲ Next.js 15.3.8
[13:44:54]: ▸ - Environments: .env
[13:44:54]: ▸   Creating an optimized production build ...
[13:45:12]: ▸ warn - The class `duration-[2s]` is ambiguous and matches multiple utilities.
[13:45:12]: ▸ warn - If this is content and not a class, replace it with `duration-&lsqb;2s&rsqb;` to silence this warning.
[13:45:20]: ▸ ✓ Compiled successfully in 25.0s
[13:45:20]: ▸   Skipping validation of types
[13:45:20]: ▸   Skipping linting
[13:45:20]: ▸   Collecting page data ...
[13:45:25]: ▸   Generating static pages (0/57) ...
[13:45:26]: ▸ 🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
[13:45:26]: ▸ 🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
[13:45:26]: ▸ 🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
[13:45:26]: ▸   Generating static pages (14/57)
[13:45:26]: ▸   Generating static pages (28/57)
[13:45:26]: ▸   Generating static pages (42/57)
[13:45:27]: ▸ ✓ Generating static pages (57/57)
[13:45:27]: ▸   Finalizing page optimization ...
[13:45:27]: ▸   Collecting build traces ...
[13:45:34]: ▸ Route (app)                                  Size  First Load JS    
[13:45:34]: ▸ ┌ ○ /                                     3.15 kB         280 kB
[13:45:34]: ▸ ├ ○ /_not-found                             990 B         103 kB
[13:45:34]: ▸ ├ ○ /admin                                3.02 kB         372 kB
[13:45:34]: ▸ ├ ○ /admin/atelier                          12 kB         426 kB
[13:45:34]: ▸ ├ ○ /admin/carousel                       8.44 kB         415 kB
[13:45:34]: ▸ ├ ○ /admin/deleted-members                4.68 kB         378 kB
[13:45:34]: ▸ ├ ○ /admin/dishes                         16.8 kB         434 kB
[13:45:34]: ▸ ├ ○ /admin/feedbacks                      4.01 kB         373 kB
[13:45:34]: ▸ ├ ○ /admin/follow-up                       113 kB         494 kB
[13:45:34]: ▸ ├ ○ /admin/messages                       1.48 kB         371 kB
[13:45:34]: ▸ ├ ○ /admin/notifications                  2.92 kB         372 kB
[13:45:34]: ▸ ├ ○ /admin/promotions                     9.98 kB         417 kB
[13:45:34]: ▸ ├ ○ /admin/publications                   4.08 kB         377 kB
[13:45:34]: ▸ ├ ○ /admin/users                          6.77 kB         397 kB
[13:45:34]: ▸ ├ ƒ /api/ai/chat                            194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/estimate-calories               194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/explain-calorie-goal            194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/generate-meal-plan              194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/generate-recipe                 194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/generate-reminder               194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/generate-shopping-list          194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/generate-title                  194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/get-invite                      194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/get-motivational-message        194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/get-recommended-dishes          194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/provide-dietary-tips            194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/recipes-from-ingredients        194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/suggest-day-plan                194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/suggest-healthy-replacements    194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/suggest-single-meal             194 B         102 kB
[13:45:34]: ▸ ├ ƒ /api/ai/track-interaction               194 B         102 kB
[13:45:34]: ▸ ├ ○ /atelier                              8.59 kB         518 kB
[13:45:34]: ▸ ├ ƒ /atelier/recipe/[id]                   6.9 kB         419 kB
[13:45:34]: ▸ ├ ○ /avatar-selection                     13.4 kB         342 kB
[13:45:34]: ▸ ├ ○ /box                                  11.8 kB         443 kB
[13:45:34]: ▸ ├ ○ /boxe                                 9.75 kB         441 kB
[13:45:34]: ▸ ├ ○ /calendar                             6.31 kB         432 kB
[13:45:34]: ▸ ├ ○ /courses                              4.72 kB         378 kB
[13:45:34]: ▸ ├ ○ /cuisine                              22.4 kB         500 kB
[13:45:34]: ▸ ├ ○ /dashboard                            26.1 kB         535 kB
[13:45:34]: ▸ ├ ○ /denied                               4.58 kB         290 kB
[13:45:34]: ▸ ├ ○ /forgot-password                      3.65 kB         293 kB
[13:45:34]: ▸ ├ ○ /foyer-control                        6.14 kB         386 kB
[13:45:34]: ▸ ├ ƒ /foyer/[id]                           1.27 kB         273 kB
[13:45:34]: ▸ ├ ○ /fridge                               5.83 kB         382 kB
[13:45:34]: ▸ ├ ƒ /join-family/[inviteId]               4.65 kB         285 kB
[13:45:34]: ▸ ├ ○ /login                                5.71 kB         207 kB
[13:45:34]: ▸ ├ ○ /mon-niveau                           5.07 kB         374 kB
[13:45:34]: ▸ ├ ○ /my-flex-ai                             11 kB         462 kB
[13:45:34]: ▸ ├ ○ /notifications                        3.11 kB         415 kB
[13:45:34]: ▸ ├ ○ /personalization                      10.3 kB         366 kB
[13:45:34]: ▸ ├ ○ /preferences                          9.15 kB         331 kB
[13:45:34]: ▸ ├ ○ /pricing                              11.9 kB         307 kB
[13:45:34]: ▸ ├ ○ /register                             6.72 kB         335 kB
[13:45:34]: ▸ ├ ○ /settings                             12.7 kB         431 kB
[13:45:34]: ▸ ├ ○ /settings/privacy                     2.24 kB         372 kB
[13:45:34]: ▸ ├ ○ /settings/terms                       2.35 kB         372 kB
[13:45:34]: ▸ └ ○ /welcome                              10.7 kB         333 kB
[13:45:34]: ▸ + First Load JS shared by all              102 kB
[13:45:34]: ▸ ├ chunks/1684-db3844069279775f.js       46.4 kB
[13:45:34]: ▸ ├ chunks/4bd1b696-0b6a7111c5ee985d.js   53.2 kB
[13:45:34]: ▸ └ other shared chunks (total)            2.2 kB
[13:45:34]: ▸ ○  (Static)   prerendered as static content
[13:45:34]: ▸ ƒ  (Dynamic)  server-rendered on demand
[13:45:34]: $ ionic info
[13:45:37]: ▸ Ionic:
[13:45:37]: ▸ Ionic CLI : 7.2.1 (/Users/ionic-cloud-team/.nvm/versions/node/v22.22.0/lib/node_modules/@ionic/cli)
[13:45:37]: ▸ Capacitor:
[13:45:37]: ▸ Capacitor CLI      : 8.1.0
[13:45:37]: ▸ @capacitor/android : 8.1.0
[13:45:37]: ▸ @capacitor/core    : 8.1.0
[13:45:37]: ▸ @capacitor/ios     : 8.1.0
[13:45:37]: ▸ Utility:
[13:45:37]: ▸ cordova-res : 0.15.4
[13:45:37]: ▸ native-run  : 2.0.3
[13:45:37]: ▸ System:
[13:45:37]: ▸ NodeJS : v22.22.0 (/Users/ionic-cloud-team/.nvm/versions/node/v22.22.0/bin/node)
[13:45:37]: ▸ npm    : 10.9.4
[13:45:37]: ▸ OS     : macOS Unknown
[13:45:37]: Generating app manifest...
[13:45:38]: -------------------------------------
[13:45:38]: --- Step: get_xcode_project_paths ---
[13:45:38]: -------------------------------------
[13:45:38]: -------------------------------
[13:45:38]: --- Step: modify_ios_config ---
[13:45:38]: -------------------------------
[13:45:38]: No custom native config detected.
[13:45:38]: ----------------------
[13:45:38]: --- Step: cap_sync ---
[13:45:38]: ----------------------
[13:45:38]: $ npx cap sync ios
[13:45:40]: ▸ ✔ Copying web assets from dist to ios/App/App/public in 5.69ms
[13:45:40]: ▸ ✔ Creating capacitor.config.json in ios/App/App in 1.00ms
[13:45:40]: ▸ ✔ copy ios in 125.44ms
[13:45:40]: ▸ ✔ Updating iOS plugins in 12.90ms
[13:45:40]: ▸ [info] All plugins have a Package.swift file and will be included in Package.swift
[13:45:40]: ▸ [info] Writing Package.swift
[13:45:40]: ▸ [info] Found 2 Capacitor plugins for ios:
[13:45:40]: ▸ @capacitor-firebase/authentication@8.1.0
[13:45:40]: ▸ @capacitor/app@8.0.1
[13:45:40]: ▸ ✔ update ios in 103.27ms
[13:45:40]: ▸ [info] Sync finished in 0.405s
[13:45:40]: -------------------------------
[13:45:40]: --- Step: cap_custom_deploy ---
[13:45:40]: -------------------------------
[13:45:40]: No custom native config detected.
[13:45:40]: ------------------------------------------
[13:45:40]: --- Step: update_code_signing_settings ---
[13:45:40]: ------------------------------------------

+---------------------------------------------------------------------------------------------------+
|                                 Summary for code signing settings                                 |
+-----------------------+---------------------------------------------------------------------------+
| path                  | /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj |
| use_automatic_signing | false                                                                     |
| team_id               | KV825CMDG7                                                                |
| code_sign_identity    | iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7)                    |
+-----------------------+---------------------------------------------------------------------------+

[13:45:40]: Updating the Automatic Codesigning flag to disabled for the given project '/Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj/project.pbxproj'
[13:45:40]: Set Team id to: KV825CMDG7 for target: App for build configuration: Debug
[13:45:40]: Set Code Sign identity to: iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7) for target: App for build configuration: Debug
[13:45:40]: Set Team id to: KV825CMDG7 for target: App for build configuration: Release
[13:45:40]: Set Code Sign identity to: iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7) for target: App for build configuration: Release
[13:45:40]: Successfully updated project settings to use Code Sign Style = 'Manual'
[13:45:40]: Modified Targets:
[13:45:40]: 	 * App
[13:45:40]: Modified Build Configurations:
[13:45:40]: 	 * Debug
[13:45:40]: 	 * Release
[13:45:40]: ------------------------------------------
[13:45:40]: --- Step: update_provisioning_profiles ---
[13:45:40]: ------------------------------------------
[13:45:40]: ---------------------------
[13:45:40]: --- Step: build_ios_app ---
[13:45:40]: ---------------------------
[13:45:40]: Resolving Swift Package Manager dependencies...
[13:45:40]: $ xcodebuild -resolvePackageDependencies -scheme App -project /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj
[13:45:43]: ▸ Command line invocation:
[13:45:43]: ▸     /Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild -resolvePackageDependencies -scheme App -project /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj
[13:45:46]: ▸ Resolve Package Graph
[13:46:03]: ▸ Fetching from https://github.com/ionic-team/capacitor-swift-pm.git
[13:46:03]: ▸ Fetching from https://github.com/google/GoogleSignIn-iOS
[13:46:14]: ▸ Fetching from https://github.com/facebook/facebook-ios-sdk.git
[13:46:14]: ▸ Fetching from https://github.com/firebase/firebase-ios-sdk.git
[13:46:34]: ▸ Fetching from https://github.com/openid/AppAuth-iOS.git
[13:46:36]: ▸ Fetching from https://github.com/google/gtm-session-fetcher.git
[13:46:36]: ▸ Fetching from https://github.com/google/app-check.git
[13:46:36]: ▸ Fetching from https://github.com/google/GTMAppAuth.git
[13:46:38]: ▸ Fetching from https://github.com/google/promises.git
[13:46:39]: ▸ Fetching from https://github.com/google/GoogleUtilities.git
[13:46:41]: ▸ Fetching from https://github.com/firebase/leveldb.git
[13:46:42]: ▸ Fetching from https://github.com/google/abseil-cpp-binary.git
[13:46:42]: ▸ Fetching from https://github.com/google/grpc-binary.git
[13:46:42]: ▸ Fetching from https://github.com/firebase/nanopb.git
[13:46:42]: ▸ Fetching from https://github.com/google/interop-ios-for-google-sdks.git
[13:46:42]: ▸ Fetching from https://github.com/google/GoogleAppMeasurement.git
[13:46:42]: ▸ Fetching from https://github.com/google/GoogleDataTransport.git
[13:46:45]: ▸ Fetching from https://github.com/googleads/google-ads-on-device-conversion-ios-sdk
[13:46:47]: ▸ Creating working copy of package ‘GTMAppAuth’
[13:46:47]: ▸ Checking out 5.0.0 of package ‘GTMAppAuth’
[13:46:47]: ▸ Creating working copy of package ‘facebook-ios-sdk’
[13:46:47]: ▸ Checking out 18.0.3 of package ‘facebook-ios-sdk’
[13:46:48]: ▸ Creating working copy of package ‘leveldb’
[13:46:48]: ▸ Checking out 1.22.5 of package ‘leveldb’
[13:46:48]: ▸ Creating working copy of package ‘promises’
[13:46:48]: ▸ Checking out 2.4.0 of package ‘promises’
[13:46:48]: ▸ Creating working copy of package ‘GoogleDataTransport’
[13:46:48]: ▸ Checking out 10.1.0 of package ‘GoogleDataTransport’
[13:46:48]: ▸ Creating working copy of package ‘firebase-ios-sdk’
[13:46:49]: ▸ Checking out 12.11.0 of package ‘firebase-ios-sdk’
[13:46:51]: ▸ Creating working copy of package ‘abseil-cpp-binary’
[13:46:51]: ▸ Checking out 1.2024072200.0 of package ‘abseil-cpp-binary’
[13:46:51]: ▸ Creating working copy of package ‘GoogleAppMeasurement’
[13:46:51]: ▸ Checking out 12.11.0 of package ‘GoogleAppMeasurement’
[13:46:51]: ▸ Creating working copy of package ‘gtm-session-fetcher’
[13:46:51]: ▸ Checking out 3.5.0 of package ‘gtm-session-fetcher’
[13:46:51]: ▸ Creating working copy of package ‘app-check’
[13:46:51]: ▸ Checking out 11.2.0 of package ‘app-check’
[13:46:51]: ▸ Creating working copy of package ‘grpc-binary’
[13:46:51]: ▸ Checking out 1.69.1 of package ‘grpc-binary’
[13:46:51]: ▸ Creating working copy of package ‘nanopb’
[13:46:51]: ▸ Checking out 2.30910.0 of package ‘nanopb’
[13:46:52]: ▸ Creating working copy of package ‘interop-ios-for-google-sdks’
[13:46:52]: ▸ Checking out 101.0.0 of package ‘interop-ios-for-google-sdks’
[13:46:52]: ▸ Creating working copy of package ‘google-ads-on-device-conversion-ios-sdk’
[13:46:52]: ▸ Checking out 3.4.0 of package ‘google-ads-on-device-conversion-ios-sdk’
[13:46:52]: ▸ Creating working copy of package ‘GoogleUtilities’
[13:46:52]: ▸ Checking out 8.1.0 of package ‘GoogleUtilities’
[13:46:52]: ▸ Creating working copy of package ‘GoogleSignIn-iOS’
[13:46:52]: ▸ Checking out 9.1.0 of package ‘GoogleSignIn-iOS’
[13:46:52]: ▸ Creating working copy of package ‘capacitor-swift-pm’
[13:46:52]: ▸ Checking out 8.1.0 of package ‘capacitor-swift-pm’
[13:46:52]: ▸ Creating working copy of package ‘AppAuth-iOS’
[13:46:52]: ▸ Checking out 2.0.0 of package ‘AppAuth-iOS’
[13:47:28]: ▸ Resolved source packages:
[13:47:28]: ▸   nanopb: https://github.com/firebase/nanopb.git @ 2.30910.0
[13:47:28]: ▸   leveldb: https://github.com/firebase/leveldb.git @ 1.22.5
[13:47:28]: ▸   InteropForGoogle: https://github.com/google/interop-ios-for-google-sdks.git @ 101.0.0
[13:47:28]: ▸   GoogleSignIn: https://github.com/google/GoogleSignIn-iOS @ 9.1.0
[13:47:28]: ▸   AppAuth: https://github.com/openid/AppAuth-iOS.git @ 2.0.0
[13:47:28]: ▸   capacitor-swift-pm: https://github.com/ionic-team/capacitor-swift-pm.git @ 8.1.0
[13:47:28]: ▸   gRPC: https://github.com/google/grpc-binary.git @ 1.69.1
[13:47:28]: ▸   AppCheck: https://github.com/google/app-check.git @ 11.2.0
[13:47:28]: ▸   GTMSessionFetcher: https://github.com/google/gtm-session-fetcher.git @ 3.5.0
[13:47:28]: ▸   GoogleDataTransport: https://github.com/google/GoogleDataTransport.git @ 10.1.0
[13:47:28]: ▸   CapApp-SPM: /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/CapApp-SPM @ local
[13:47:28]: ▸   GoogleUtilities: https://github.com/google/GoogleUtilities.git @ 8.1.0
[13:47:28]: ▸   GTMAppAuth: https://github.com/google/GTMAppAuth.git @ 5.0.0
[13:47:28]: ▸   CapacitorApp: /Users/ionic-cloud-team/builds/sandroallada-png/mcf/node_modules/@capacitor/app @ local
[13:47:28]: ▸   GoogleAdsOnDeviceConversion: https://github.com/googleads/google-ads-on-device-conversion-ios-sdk @ 3.4.0
[13:47:28]: ▸   Facebook: https://github.com/facebook/facebook-ios-sdk.git @ 18.0.3
[13:47:28]: ▸   Promises: https://github.com/google/promises.git @ 2.4.0
[13:47:28]: ▸   abseil: https://github.com/google/abseil-cpp-binary.git @ 1.2024072200.0
[13:47:28]: ▸   CapacitorFirebaseAuthentication: /Users/ionic-cloud-team/builds/sandroallada-png/mcf/node_modules/@capacitor-firebase/authentication @ local
[13:47:28]: ▸   GoogleAppMeasurement: https://github.com/google/GoogleAppMeasurement.git @ 12.11.0
[13:47:28]: ▸   Firebase: https://github.com/firebase/firebase-ios-sdk.git @ 12.11.0
[13:47:28]: ▸ resolved source packages: nanopb, leveldb, InteropForGoogle, GoogleSignIn, AppAuth, capacitor-swift-pm, gRPC, AppCheck, GTMSessionFetcher, GoogleDataTransport, CapApp-SPM, GoogleUtilities, GTMAppAuth, CapacitorApp, GoogleAdsOnDeviceConversion, Facebook, Promises, abseil, CapacitorFirebaseAuthentication, GoogleAppMeasurement, Firebase
[13:47:28]: $ xcodebuild -showBuildSettings -scheme App -project /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj 2>&1
[13:47:31]: Command timed out after 3 seconds on try 1 of 4, trying again with a 6 second timeout...
[13:47:37]: Command timed out after 6 seconds on try 2 of 4, trying again with a 12 second timeout...
[13:47:49]: Command timed out after 12 seconds on try 3 of 4, trying again with a 24 second timeout...
[13:48:02]: Detected provisioning profile mapping: {"my.cook.flex": "mcf-distribution"}

+------------------------------------------------------------------------------------------------------------------------------+
|                                                   Summary for gym 2.230.0                                                    |
+--------------------------------------------------+---------------------------------------------------------------------------+
| project                                          | /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj |
| output_directory                                 | /Users/ionic-cloud-team/builds/sandroallada-png/mcf                       |
| output_name                                      | 1401a6f1-a905-4f06-a5e7-5027c603e012-app-store                            |
| archive_path                                     | 1401a6f1-a905-4f06-a5e7-5027c603e012-app-store.xcarchive                  |
| scheme                                           | App                                                                       |
| codesigning_identity                             | iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7)                    |
| export_team_id                                   | KV825CMDG7                                                                |
| catalyst_platform                                | ios                                                                       |
| export_options.provisioningProfiles.my.cook.flex | mcf-distribution                                                          |
| clean                                            | false                                                                     |
| silent                                           | false                                                                     |
| skip_package_ipa                                 | false                                                                     |
| export_method                                    | app-store                                                                 |
| build_path                                       | /Users/ionic-cloud-team/Library/Developer/Xcode/Archives/2026-04-01       |
| result_bundle                                    | false                                                                     |
| buildlog_path                                    | ~/Library/Logs/gym                                                        |
| destination                                      | generic/platform=iOS                                                      |
| xcodebuild_formatter                             | xcbeautify                                                                |
| build_timing_summary                             | false                                                                     |
| skip_profile_detection                           | false                                                                     |
| xcodebuild_command                               | xcodebuild                                                                |
| skip_package_dependencies_resolution             | false                                                                     |
| disable_package_automatic_updates                | false                                                                     |
| use_system_scm                                   | false                                                                     |
| generate_appstore_info                           | false                                                                     |
| skip_package_pkg                                 | false                                                                     |
| xcode_path                                       | /Applications/Xcode.app                                                   |
+--------------------------------------------------+---------------------------------------------------------------------------+

[13:48:02]: $ set -o pipefail && xcodebuild -scheme App -project /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj -destination 'generic/platform=iOS' -archivePath 1401a6f1-a905-4f06-a5e7-5027c603e012-app-store.xcarchive archive CODE_SIGN_IDENTITY=iPhone\ Distribution:\ Setondji\ Maxy\ Djisso\ \(KV825CMDG7\) | tee /Users/ionic-cloud-team/Library/Logs/gym/App-App.log | xcbeautify
[13:48:02]: ▸ ----- xcbeautify -----
[13:48:02]: ▸ Version: 3.1.2
[13:48:02]: ▸ ----------------------
[13:48:05]: ▸ Resolving Package Graph
[13:48:06]: ▸ Resolved source packages
[13:48:06]: ▸ GTMAppAuth - https://github.com/google/GTMAppAuth.git @ 5.0.0
[13:48:06]: ▸ GoogleAdsOnDeviceConversion - https://github.com/googleads/google-ads-on-device-conversion-ios-sdk @ 3.4.0
[13:48:06]: ▸ abseil - https://github.com/google/abseil-cpp-binary.git @ 1.2024072200.0
[13:48:06]: ▸ GoogleSignIn - https://github.com/google/GoogleSignIn-iOS @ 9.1.0
[13:48:06]: ▸ GoogleAppMeasurement - https://github.com/google/GoogleAppMeasurement.git @ 12.11.0
[13:48:06]: ▸ AppAuth - https://github.com/openid/AppAuth-iOS.git @ 2.0.0
[13:48:06]: ▸ gRPC - https://github.com/google/grpc-binary.git @ 1.69.1
[13:48:06]: ▸ InteropForGoogle - https://github.com/google/interop-ios-for-google-sdks.git @ 101.0.0
[13:48:06]: ▸ GoogleDataTransport - https://github.com/google/GoogleDataTransport.git @ 10.1.0
[13:48:06]: ▸ Facebook - https://github.com/facebook/facebook-ios-sdk.git @ 18.0.3
[13:48:06]: ▸ Firebase - https://github.com/firebase/firebase-ios-sdk.git @ 12.11.0
[13:48:06]: ▸ nanopb - https://github.com/firebase/nanopb.git @ 2.30910.0
[13:48:06]: ▸ GTMSessionFetcher - https://github.com/google/gtm-session-fetcher.git @ 3.5.0
[13:48:06]: ▸ leveldb - https://github.com/firebase/leveldb.git @ 1.22.5
[13:48:06]: ▸ Promises - https://github.com/google/promises.git @ 2.4.0
[13:48:06]: ▸ GoogleUtilities - https://github.com/google/GoogleUtilities.git @ 8.1.0
[13:48:06]: ▸ capacitor-swift-pm - https://github.com/ionic-team/capacitor-swift-pm.git @ 8.1.0
[13:48:06]: ▸ AppCheck - https://github.com/google/app-check.git @ 11.2.0
[13:48:06]: ▸ note: Using codesigning identity override: iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7)
[13:48:08]: ▸ note: Building targets in dependency order
[13:48:08]: ▸ note: Target dependency graph (73 targets)
[13:48:13]: ▸ ❌ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/AppAuth-iOS/Package.swift: Signing for "AppAuth_AppAuthCore" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'AppAuth_AppAuthCore' from project 'AppAuth')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/firebase-ios-sdk/Package.swift: error: Signing for "Firebase_FirebaseCoreExtension" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Firebase_FirebaseCoreExtension' from project 'Firebase')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/AppAuth-iOS/Package.swift: error: Signing for "AppAuth_AppAuth" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'AppAuth_AppAuth' from project 'AppAuth')
[13:48:13]: ▸ ❌ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/firebase-ios-sdk/Package.swift: Signing for "Firebase_FirebaseCoreInternal" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Firebase_FirebaseCoreInternal' from project 'Firebase')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GTMAppAuth/Package.swift: error: Signing for "GTMAppAuth_GTMAppAuth" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GTMAppAuth_GTMAppAuth' from project 'GTMAppAuth')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-UserDefaults" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-UserDefaults' from project 'GoogleUtilities')
[13:48:13]: ▸ ❌ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/facebook-ios-sdk/Package.swift: Signing for "Facebook_FacebookAEM" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Facebook_FacebookAEM' from project 'Facebook')
[13:48:13]: ▸ /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj: error: "App" requires a provisioning profile. Select a provisioning profile in the Signing & Capabilities editor. (in target 'App' from project 'App')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/gtm-session-fetcher/Package.swift: error: Signing for "GTMSessionFetcher_GTMSessionFetcherCore" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GTMSessionFetcher_GTMSessionFetcherCore' from project 'GTMSessionFetcher')
[13:48:13]: ▸ ❌ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: Signing for "GoogleUtilities_GoogleUtilities-NSData" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-NSData' from project 'GoogleUtilities')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleSignIn-iOS/Package.swift: error: Signing for "GoogleSignIn_GoogleSignIn" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleSignIn_GoogleSignIn' from project 'GoogleSignIn')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/firebase-ios-sdk/Package.swift: error: Signing for "Firebase_FirebaseCore" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Firebase_FirebaseCore' from project 'Firebase')
[13:48:13]: ▸ ❌ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/promises/Package.swift: Signing for "Promises_FBLPromises" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Promises_FBLPromises' from project 'Promises')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/firebase-ios-sdk/Package.swift: error: Signing for "Firebase_FirebaseAuth" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Firebase_FirebaseAuth' from project 'Firebase')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/facebook-ios-sdk/Package.swift: error: Signing for "Facebook_FacebookCore" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Facebook_FacebookCore' from project 'Facebook')
[13:48:13]: ▸ ❌ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: Signing for "GoogleUtilities_GoogleUtilities-AppDelegateSwizzler" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-AppDelegateSwizzler' from project 'GoogleUtilities')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Reachability" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Reachability' from project 'GoogleUtilities')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Environment" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Environment' from project 'GoogleUtilities')
[13:48:13]: ▸ ❌ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/facebook-ios-sdk/Package.swift: Signing for "Facebook_FacebookLogin" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Facebook_FacebookLogin' from project 'Facebook')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Logger" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Logger' from project 'GoogleUtilities')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Network" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Network' from project 'GoogleUtilities')
[13:48:13]: ▸ ** ARCHIVE FAILED **
[13:48:13]: ▸ The following build commands failed:
[13:48:13]: ▸ 	Archiving project App with scheme App
[13:48:13]: ▸ (1 failure)
[13:48:13]: Exit status: 65

+-----------------------------------------+
|            Build environment            |
+---------------+-------------------------+
| xcode_path    | /Applications/Xcode.app |
| gym_version   | 2.230.0                 |
| export_method | app-store               |
| sdk           | iPhoneOS26.2.sdk        |
+---------------+-------------------------+

[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Reachability" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Reachability' from project 'GoogleUtilities')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Environment" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Environment' from project 'GoogleUtilities')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/facebook-ios-sdk/Package.swift: error: Signing for "Facebook_FacebookLogin" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'Facebook_FacebookLogin' from project 'Facebook')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Logger" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Logger' from project 'GoogleUtilities')
[13:48:13]: ▸ /Users/ionic-cloud-team/Library/Developer/Xcode/DerivedData/App-bbvzsewqzsxvlogrbtnkemzmgwnt/SourcePackages/checkouts/GoogleUtilities/Package.swift: error: Signing for "GoogleUtilities_GoogleUtilities-Network" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'GoogleUtilities_GoogleUtilities-Network' from project 'GoogleUtilities')
[13:48:13]: 
[13:48:13]: ⬆️  Check out the few lines of raw `xcodebuild` output above for potential hints on how to solve this error
[13:48:13]: 📋  For the complete and more detailed error log, check the full log at:
[13:48:13]: 📋  /Users/ionic-cloud-team/Library/Logs/gym/App-App.log
[13:48:13]: 
[13:48:13]: Looks like fastlane ran into a build/archive error with your project
[13:48:13]: It's hard to tell what's causing the error, so we wrote some guides on how
[13:48:13]: to troubleshoot build and signing issues: https://docs.fastlane.tools/codesigning/getting-started/
[13:48:13]: Before submitting an issue on GitHub, please follow the guide above and make
[13:48:13]: sure your project is set up correctly.
[13:48:13]: fastlane uses `xcodebuild` commands to generate your binary, you can see the
[13:48:13]: the full commands printed out in yellow in the above log.
[13:48:13]: Make sure to inspect the output above, as usually you'll find more error information there
[13:48:13]: 
[13:48:13]: -------------------------
[13:48:13]: --- Step: upload_logs ---
[13:48:13]: -------------------------
[13:48:32]: --------------------------------------
[13:48:32]: --- Step: sentry_capture_exception ---
[13:48:32]: --------------------------------------
[13:48:40]: ---------------------------
[13:48:40]: --- Step: shell command ---
[13:48:40]: ---------------------------
[13:48:40]: Error building the application - see the log above
+----------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                    Lane Context                                                                    |
+-------------------------------------+--------------------------------------------------------------------------------------------------------------+
| DEFAULT_PLATFORM                    | ios                                                                                                          |
| PLATFORM_NAME                       | ios                                                                                                          |
| LANE_NAME                           | ios build_capacitor                                                                                          |
| KEYCHAIN_PATH                       | ~/Library/Keychains/IonicKeychain                                                                            |
| DOWNLOAD_CERTS_PROVISION_FILE_UUID  | ca5009a3-c2f6-4a05-b7f1-1b719a43c05e                                                                         |
| DOWNLOAD_CERTS_CODESIGNING_IDENTITY | iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7)                                                       |
| DOWNLOAD_CERTS_TEAM_ID              | KV825CMDG7                                                                                                   |
| DOWNLOAD_CERTS_CERT_PATH            | /Users/ionic-cloud-team/builds/sandroallada-png/mcf/cert_file.p12                                            |
| SIGH_PROFILE_PATHS                  | ["/Users/ionic-cloud-team/builds/sandroallada-png/mcf/ca5009a3-c2f6-4a05-b7f1-1b719a43c05e.mobileprovision"] |
| IONIC_CLI_VERSION                   | 7.2.1                                                                                                        |
| NODE_PACKAGE_MANAGER                | npm                                                                                                          |
| CAP_IOS_PATH                        | /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios                                                      |
| IOS_PACKAGE_MANAGER                 | spm                                                                                                          |
| PROJECT_WEB_DIR                     | dist                                                                                                         |
| XCODE_PROJECT_NAME                  | App                                                                                                          |
| XCODE_PROJECT_PATH                  | /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcodeproj                                    |
| XCODE_WORKSPACE_PATH                | /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/App.xcworkspace                                  |
+-------------------------------------+--------------------------------------------------------------------------------------------------------------+
[13:48:40]: Error building the application - see the log above

+---------------------------------------------------+
|                 fastlane summary                  |
+------+------------------------------+-------------+
| Step | Action                       | Time (in s) |
+------+------------------------------+-------------+
| 1    | add_extra_platforms          | 0           |
| 2    | default_platform             | 0           |
| 3    | prepare_environment          | 0           |
| 4    | sentry_init                  | 0           |
| 5    | begin_building               | 0           |
| 6    | build_summary                | 4           |
| 7    | create_keychain              | 0           |
| 8    | get_ios_credentials_from_api | 0           |
| 9    | set_ios_credentials          | 1           |
| 10   | import_certificate           | 0           |
| 11   | set_ionic_cli                | 1           |
| 12   | detect_package_manager       | 0           |
| 13   | add_git_credentials          | 0           |
| 14   | get_appflow_config           | 0           |
| 15   | dependency_install           | 29          |
| 16   | create_capacitor_config      | 1           |
| 17   | detect_ios_package_manager   | 0           |
| 18   | get_web_dir                  | 0           |
| 19   | modify_cap_web_config        | 0           |
| 20   | build_pro_app                | 44          |
| 21   | get_xcode_project_paths      | 0           |
| 22   | modify_ios_config            | 0           |
| 23   | cap_sync                     | 2           |
| 24   | cap_custom_deploy            | 0           |
| 25   | update_code_signing_settings | 0           |
| 26   | update_provisioning_profiles | 0           |
| 💥   | build_ios_app                | 152         |
| 28   | upload_logs                  | 19          |
| 29   | sentry_capture_exception     | 7           |
| 30   | shell command                | 0           |
+------+------------------------------+-------------+

[13:48:40]: fastlane finished with errors

[!] Error building the application - see the log above
Running after_script
Running after script...
$ clean-up
Cleaning up project directory and file based variables
Terminating VM: build_stack_2026.01_arm64-1775050998813572000 (056f96fc-7718-4c4f-aa0b-d9c9abb899be) | Controller Instance ID: 765892e1-e6da-46fd-604d-11a85a6c4063 | Host: 10.2.164.196
ERROR: Job failed: Process exited with status 1