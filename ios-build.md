Running with gitlab-runner 14.10.1/1.6.1 (029651c8)
  on ANKA_RUNNER 161fa1c3
Preparing the "anka" executor
Opening a connection to the Anka Cloud Controller: https://controller.green.us-west-2.apple-orchard.net:443
Starting Anka VM using:
  - VM Template UUID: a2cafd4d-8237-47b3-83dc-47fdd53d37aa
  - VM Template Tag Name: v1
Please be patient...
You can check the status of starting your Instance on the Anka Cloud Controller: https://controller.green.us-west-2.apple-orchard.net:443/#/instances
Verifying connectivity to the VM: build_stack_2026.01_arm64-1775850240547864000 (345d0b60-2706-4575-abd7-ccb40ee3e288) | Controller Instance ID: 1750f8b6-2f36-4286-6ec4-cafa5263d63b | Host: 10.2.161.139 | Port: 10000 
VM "build_stack_2026.01_arm64-1775850240547864000" (345d0b60-2706-4575-abd7-ccb40ee3e288) / Controller Instance ID 1750f8b6-2f36-4286-6ec4-cafa5263d63b running on Node ip-10-2-161-139.us-west-2.compute.internal (10.2.161.139), is ready for work (10.2.161.139:10000)
Preparing environment
Running on ip-192-168-64-23.us-west-2.compute.internal via ip-10-2-128-69.us-west-2.compute.internal...
Getting source from Git repository
$ pre-clone
[19:44:32]: Cloning repository...
Fetching changes...
Initialized empty Git repository in /Users/ionic-cloud-team/builds/sandroallada-png/mcf/.git/
Created fresh repository.
failed to store: -25308
Checking out 85f24271 as main...
Updating/initializing submodules...
$ post-clone
[19:44:34]: Cloning complete...
Executing "step_script" stage of the job script
$ pre-build
[19:44:34]: Building project....
$ fetch-updates || true
Checking for build process updates...
$ build-ios
Top level ::CompositeIO is deprecated, require 'multipart/post' and use `Multipart::Post::CompositeReadIO` instead!
Top level ::Parts is deprecated, require 'multipart/post' and use `Multipart::Post::Parts` instead!
[19:44:38]: ---------------------------------
[19:44:38]: --- Step: add_extra_platforms ---
[19:44:38]: ---------------------------------
[19:44:38]: Setting '[:web]' as extra SupportedPlatforms
[19:44:38]: ------------------------------
[19:44:38]: --- Step: default_platform ---
[19:44:38]: ------------------------------
[19:44:38]: Driving the lane 'ios build_capacitor' 🚀
[19:44:38]: ---------------------------------
[19:44:38]: --- Step: prepare_environment ---
[19:44:38]: ---------------------------------
[19:44:38]: Setting default environment variables to tidy up logs. These can be overridden by setting them in Appflow.
[19:44:38]: 
[19:44:38]: No changes needed - logs are already tidy! 🧹
[19:44:38]: -------------------------
[19:44:38]: --- Step: sentry_init ---
[19:44:38]: -------------------------
[19:44:38]: ----------------------------
[19:44:38]: --- Step: begin_building ---
[19:44:38]: ----------------------------
[19:44:38]: Began building @ 2026-04-10T19:44:38
[19:44:38]: ---------------------------
[19:44:38]: --- Step: build_summary ---
[19:44:38]: ---------------------------

+---------------------------------------------------+
|                   Build Summary                   |
+---------------------+-----------------------------+
| Runners Revision    | 4926248                     |
| Job ID              | 10857311                    |
| Node.js version     | v22.22.0                    |
| Cordova CLI version | 12.0.0 (cordova-lib@12.0.2) |
| npm version         | 10.9.4                      |
| yarn version        | 1.22.19                     |
| macOS version       | 15.6                        |
| Xcode version       | Xcode 26.2                  |
|                     | Build version 17C52         |
| Fastlane version    | fastlane (2.230.0)          |
+---------------------+-----------------------------+

[19:44:42]: -----------------------------
[19:44:42]: --- Step: create_keychain ---
[19:44:42]: -----------------------------
[19:44:42]: $ security list-keychains -d user
[19:44:42]: ▸ "/Users/ionic-cloud-team/Library/Keychains/login.keychain-db"
[19:44:42]: ------------------------------------------
[19:44:42]: --- Step: get_ios_credentials_from_api ---
[19:44:42]: ------------------------------------------
[19:44:42]: Fetching certificate and profile(s) from Ionic Appflow
[19:44:42]: ---------------------------------
[19:44:42]: --- Step: set_ios_credentials ---
[19:44:42]: ---------------------------------
[19:44:42]: Installing provisioning profile...
[19:44:43]: /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ca5009a3-c2f6-4a05-b7f1-1b719a43c05e.mobileprovision

+----------------------------------------------------------------------------+
|                           Installed Certificate                            |
+-------------------+--------------------------------------------------------+
| User ID           | KV825CMDG7                                             |
| Common Name       | iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7) |
| Organization Unit | KV825CMDG7                                             |
| Organization      | Setondji Maxy Djisso                                   |
| Country           | FR                                                     |
+-------------------+--------------------------------------------------------+

[19:44:43]: --------------------------------
[19:44:43]: --- Step: import_certificate ---
[19:44:43]: --------------------------------
[19:44:43]: Setting key partition list... (this can take a minute if there are a lot of keys installed)
[19:44:43]: ---------------------------
[19:44:43]: --- Step: set_ionic_cli ---
[19:44:43]: ---------------------------
[19:44:44]: Preinstalled @ionic/cli compatible with project `custom`
[19:44:44]: ------------------------------------
[19:44:44]: --- Step: detect_package_manager ---
[19:44:44]: ------------------------------------
[19:44:44]: Detecting package manager
[19:44:44]: Defaulting to npm
[19:44:44]: ---------------------------------
[19:44:44]: --- Step: add_git_credentials ---
[19:44:44]: ---------------------------------
[19:44:44]: Writing git-credentials files
[19:44:44]: git-credentials successfully added to project
[19:44:44]: --------------------------------
[19:44:44]: --- Step: get_appflow_config ---
[19:44:44]: --------------------------------
[19:44:44]: Checking for appflow.config.json
[19:44:44]: Appflow config not detected
[19:44:44]: --------------------------------
[19:44:44]: --- Step: dependency_install ---
[19:44:44]: --------------------------------
[19:44:44]: Installing Dependencies (in /Users/ionic-cloud-team/builds/sandroallada-png/mcf)
[19:44:44]: $ npm ci --quiet 
[19:44:45]: ▸ npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[19:44:45]: ▸ npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
[19:44:45]: ▸ npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[19:44:45]: ▸ npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[19:44:45]: ▸ npm warn deprecated q@1.5.1: You or someone you depend on is using Q, the JavaScript Promise library that gave JavaScript developers strong feelings about promises. They can almost certainly migrate to the native JavaScript promise now. Thank you literally everyone for joining me in this bet against the odds. Be excellent to each other.
[19:44:45]: ▸ npm warn deprecated
[19:44:45]: ▸ npm warn deprecated (For a CapTP with native promises, see @endo/eventual-send and @endo/captp)
[19:44:46]: ▸ npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
[19:44:46]: ▸ npm warn deprecated tar@6.2.1: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[19:44:46]: ▸ npm warn deprecated @types/xlsx@0.0.36: This is a stub types definition for xlsx (https://github.com/sheetjs/js-xlsx). xlsx provides its own type definitions, so you don't need @types/xlsx installed!
[19:44:48]: ▸ npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*
[19:44:48]: ▸ npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*
[19:44:48]: ▸ npm warn deprecated glob@9.3.5: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[19:45:05]: ▸ > my-cook-flex@0.1.0 postinstall
[19:45:05]: ▸ > bash scripts/fix-ios-signing.sh
[19:45:05]: ▸ --- MCF CUSTOM SIGNING FIX (from postinstall) START ---
[19:45:05]: ▸ Setting Team ID to KV825CMDG7...
[19:45:05]: ▸ Setting Manual Sign Style...
[19:45:05]: ▸ Disabling signing for dependencies...
[19:45:05]: ▸ --- MCF CUSTOM SIGNING FIX END ---
[19:45:05]: ▸ added 982 packages, and audited 983 packages in 21s
[19:45:05]: ▸ 186 packages are looking for funding
[19:45:05]: ▸ run `npm fund` for details
[19:45:05]: ▸ 22 vulnerabilities (2 low, 4 moderate, 14 high, 2 critical)
[19:45:05]: ▸ To address issues that do not require attention, run:
[19:45:05]: ▸ npm audit fix
[19:45:05]: ▸ To address all issues possible (including breaking changes), run:
[19:45:05]: ▸ npm audit fix --force
[19:45:05]: ▸ Some issues need review, and may require choosing
[19:45:05]: ▸ a different dependency.
[19:45:05]: ▸ Run `npm audit` for details.
[19:45:05]: -------------------------------------
[19:45:05]: --- Step: create_capacitor_config ---
[19:45:05]: -------------------------------------
[19:45:06]: Created capacitor.config.json from capacitor.config.ts/js
[19:45:06]: ----------------------------------------
[19:45:06]: --- Step: detect_ios_package_manager ---
[19:45:06]: ----------------------------------------
[19:45:06]: Detected SPM project (found /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/CapApp-SPM)
[19:45:06]: Detected iOS package manager: spm
[19:45:06]: -------------------------
[19:45:06]: --- Step: get_web_dir ---
[19:45:06]: -------------------------
[19:45:06]: webDir is `out`
[19:45:06]: -----------------------------------
[19:45:06]: --- Step: modify_cap_web_config ---
[19:45:06]: -----------------------------------
[19:45:06]: No custom native config detected.
[19:45:06]: ---------------------------
[19:45:06]: --- Step: build_pro_app ---
[19:45:06]: ---------------------------
[19:45:06]: Building app from /Users/ionic-cloud-team/builds/sandroallada-png/mcf
[19:45:06]: Build script detected...
[19:45:06]: $ npm run build
[19:45:06]: ▸ > my-cook-flex@0.1.0 build
[19:45:06]: ▸ > next build
[19:45:07]: ▸ ⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
[19:45:07]: ▸ Attention: Next.js now collects completely anonymous telemetry regarding usage.
[19:45:07]: ▸ This information is used to shape Next.js' roadmap and prioritize features.
[19:45:07]: ▸ You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[19:45:07]: ▸ https://nextjs.org/telemetry
[19:45:07]: ▸ ▲ Next.js 15.3.8
[19:45:07]: ▸ - Environments: .env
[19:45:07]: ▸   Creating an optimized production build ...
[19:45:19]: ▸ warn - The class `duration-[2s]` is ambiguous and matches multiple utilities.
[19:45:19]: ▸ warn - If this is content and not a class, replace it with `duration-&lsqb;2s&rsqb;` to silence this warning.
[19:45:24]: ▸ ✓ Compiled successfully in 17.0s
[19:45:24]: ▸   Skipping validation of types
[19:45:24]: ▸   Skipping linting
[19:45:24]: ▸   Collecting page data ...
[19:45:27]: ▸   Generating static pages (0/60) ...
[19:45:28]: ▸ 🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
[19:45:28]: ▸ 🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
[19:45:28]: ▸ 🌐 i18next is made possible by our own product, Locize — consider powering your project with managed localization (AI, CDN, integrations): https://locize.com 💙
[19:45:28]: ▸   Generating static pages (15/60)
[19:45:28]: ▸   Generating static pages (30/60)
[19:45:28]: ▸   Generating static pages (45/60)
[19:45:28]: ▸ ✓ Generating static pages (60/60)
[19:45:28]: ▸   Finalizing page optimization ...
[19:45:28]: ▸   Collecting build traces ...
[19:45:32]: ▸ Route (app)                                  Size  First Load JS    
[19:45:32]: ▸ ┌ ○ /                                     3.15 kB         280 kB
[19:45:32]: ▸ ├ ○ /_not-found                             990 B         103 kB
[19:45:32]: ▸ ├ ○ /admin                                3.02 kB         372 kB
[19:45:32]: ▸ ├ ○ /admin/atelier                          12 kB         426 kB
[19:45:32]: ▸ ├ ○ /admin/carousel                       8.44 kB         416 kB
[19:45:32]: ▸ ├ ○ /admin/deleted-members                4.68 kB         378 kB
[19:45:32]: ▸ ├ ○ /admin/dishes                         16.8 kB         435 kB
[19:45:32]: ▸ ├ ○ /admin/feedbacks                         4 kB         373 kB
[19:45:32]: ▸ ├ ○ /admin/follow-up                       113 kB         493 kB
[19:45:32]: ▸ ├ ○ /admin/messages                       1.48 kB         371 kB
[19:45:32]: ▸ ├ ○ /admin/notifications                  2.91 kB         372 kB
[19:45:32]: ▸ ├ ○ /admin/promotions                     9.98 kB         417 kB
[19:45:32]: ▸ ├ ○ /admin/publications                   4.08 kB         377 kB
[19:45:32]: ▸ ├ ○ /admin/users                          6.75 kB         397 kB
[19:45:32]: ▸ ├ ƒ /api/ai/chat                            194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/estimate-calories               194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/explain-calorie-goal            194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/generate-meal-plan              194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/generate-recipe                 194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/generate-reminder               194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/generate-shopping-list          194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/generate-title                  194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/get-invite                      194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/get-motivational-message        194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/get-recommended-dishes          194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/provide-dietary-tips            194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/recipes-from-ingredients        194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/suggest-day-plan                194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/suggest-healthy-replacements    194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/suggest-single-meal             194 B         102 kB
[19:45:32]: ▸ ├ ƒ /api/ai/track-interaction               194 B         102 kB
[19:45:32]: ▸ ├ ○ /atelier                              8.59 kB         518 kB
[19:45:32]: ▸ ├ ● /atelier/recipe/[id]                  6.92 kB         419 kB
[19:45:32]: ▸ ├   └ /atelier/recipe/placeholder
[19:45:32]: ▸ ├ ○ /avatar-selection                     13.3 kB         342 kB
[19:45:32]: ▸ ├ ○ /box                                  11.8 kB         443 kB
[19:45:32]: ▸ ├ ○ /boxe                                 9.75 kB         441 kB
[19:45:32]: ▸ ├ ○ /calendar                             6.31 kB         432 kB
[19:45:32]: ▸ ├ ○ /courses                              4.64 kB         427 kB
[19:45:32]: ▸ ├ ○ /cuisine                              22.2 kB         549 kB
[19:45:32]: ▸ ├ ○ /dashboard                            25.9 kB         570 kB
[19:45:32]: ▸ ├ ○ /denied                               4.58 kB         290 kB
[19:45:32]: ▸ ├ ○ /forgot-password                      3.65 kB         293 kB
[19:45:32]: ▸ ├ ○ /foyer-control                        6.13 kB         386 kB
[19:45:32]: ▸ ├ ● /foyer/[id]                           1.31 kB         273 kB
[19:45:32]: ▸ ├   └ /foyer/placeholder
[19:45:32]: ▸ ├ ○ /fridge                               4.99 kB         374 kB
[19:45:32]: ▸ ├ ● /join-family/[inviteId]               4.52 kB         284 kB
[19:45:32]: ▸ ├   └ /join-family/placeholder
[19:45:32]: ▸ ├ ○ /login                                5.71 kB         207 kB
[19:45:32]: ▸ ├ ○ /mon-niveau                           4.99 kB         424 kB
[19:45:32]: ▸ ├ ○ /my-flex-ai                           6.91 kB         376 kB
[19:45:32]: ▸ ├ ○ /notifications                        3.11 kB         415 kB
[19:45:32]: ▸ ├ ○ /personalization                      10.3 kB         366 kB
[19:45:32]: ▸ ├ ○ /preferences                          9.13 kB         331 kB
[19:45:32]: ▸ ├ ○ /pricing                              11.9 kB         307 kB
[19:45:32]: ▸ ├ ○ /register                             6.72 kB         335 kB
[19:45:32]: ▸ ├ ○ /settings                             14.3 kB         433 kB
[19:45:32]: ▸ ├ ○ /settings/privacy                     2.24 kB         371 kB
[19:45:32]: ▸ ├ ○ /settings/terms                       2.35 kB         372 kB
[19:45:32]: ▸ └ ○ /welcome                              10.7 kB         333 kB
[19:45:32]: ▸ + First Load JS shared by all              102 kB
[19:45:32]: ▸ ├ chunks/1684-f03dcf8b97de8a31.js       46.4 kB
[19:45:32]: ▸ ├ chunks/4bd1b696-0b6a7111c5ee985d.js   53.2 kB
[19:45:32]: ▸ └ other shared chunks (total)           2.22 kB
[19:45:32]: ▸ ○  (Static)   prerendered as static content
[19:45:32]: ▸ ●  (SSG)      prerendered as static HTML (uses generateStaticParams)
[19:45:32]: ▸ ƒ  (Dynamic)  server-rendered on demand
[19:45:32]: $ ionic info
[19:45:33]: ▸ Ionic:
[19:45:33]: ▸ Ionic CLI : 7.2.1 (/Users/ionic-cloud-team/.nvm/versions/node/v22.22.0/lib/node_modules/@ionic/cli)
[19:45:33]: ▸ Capacitor:
[19:45:33]: ▸ Capacitor CLI      : 8.1.0
[19:45:33]: ▸ @capacitor/android : 8.1.0
[19:45:33]: ▸ @capacitor/core    : 8.1.0
[19:45:33]: ▸ @capacitor/ios     : 8.1.0
[19:45:33]: ▸ Utility:
[19:45:33]: ▸ cordova-res : 0.15.4
[19:45:33]: ▸ native-run  : 2.0.3
[19:45:33]: ▸ System:
[19:45:33]: ▸ NodeJS : v22.22.0 (/Users/ionic-cloud-team/.nvm/versions/node/v22.22.0/bin/node)
[19:45:33]: ▸ npm    : 10.9.4
[19:45:33]: ▸ OS     : macOS Unknown
[19:45:33]: -------------------------
[19:45:33]: --- Step: upload_logs ---
[19:45:33]: -------------------------
[19:45:37]: --------------------------------------
[19:45:37]: --- Step: sentry_capture_exception ---
[19:45:37]: --------------------------------------
[19:45:37]: ---------------------------
[19:45:37]: --- Step: shell command ---
[19:45:37]: ---------------------------
[19:45:37]: No out found in root of project.
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
| PROJECT_WEB_DIR                     | out                                                                                                          |
+-------------------------------------+--------------------------------------------------------------------------------------------------------------+
[19:45:37]: No out found in root of project.

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
| 6    | build_summary                | 3           |
| 7    | create_keychain              | 0           |
| 8    | get_ios_credentials_from_api | 0           |
| 9    | set_ios_credentials          | 0           |
| 10   | import_certificate           | 0           |
| 11   | set_ionic_cli                | 1           |
| 12   | detect_package_manager       | 0           |
| 13   | add_git_credentials          | 0           |
| 14   | get_appflow_config           | 0           |
| 15   | dependency_install           | 21          |
| 16   | create_capacitor_config      | 0           |
| 17   | detect_ios_package_manager   | 0           |
| 18   | get_web_dir                  | 0           |
| 19   | modify_cap_web_config        | 0           |
| 💥   | build_pro_app                |27          |
| 21   | upload_logs                  | 3           |
| 22   | sentry_capture_exception     | 0           |
| 23   | shell command                | 0           |
+------+------------------------------+-------------+

[19:45:37]: fastlane finished with errors
/opt/homebrew/Cellar/fastlane/2.230.0_1/libexec/bin/fastlane: [!] No out found in root of project. (RuntimeError)
Running after_script
Running after script...
$ clean-up
Cleaning up project directory and file based variables
Terminating VM: build_stack_2026.01_arm64-1775850240547864000 (345d0b60-2706-4575-abd7-ccb40ee3e288) | Controller Instance ID: 1750f8b6-2f36-4286-6ec4-cafa5263d63b | Host: 10.2.161.139
ERROR: Job failed: Process exited with status 1