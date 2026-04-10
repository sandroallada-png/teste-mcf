Running with gitlab-runner 14.10.1/1.6.1 (029651c8)
  on ANKA_RUNNER 161fa1c3
Preparing the "anka" executor
Opening a connection to the Anka Cloud Controller: https://controller.green.us-west-2.apple-orchard.net:443
Starting Anka VM using:
  - VM Template UUID: a2cafd4d-8237-47b3-83dc-47fdd53d37aa
  - VM Template Tag Name: v1
Please be patient...
You can check the status of starting your Instance on the Anka Cloud Controller: https://controller.green.us-west-2.apple-orchard.net:443/#/instances
Verifying connectivity to the VM: build_stack_2026.01_arm64-1775844659672214000 (4f3b9d88-6545-4046-a9a8-62aed4d6ee9f) | Controller Instance ID: d821f451-62e3-4187-53bb-dd51ceaeee2c | Host: 10.2.182.10 | Port: 10000 
VM "build_stack_2026.01_arm64-1775844659672214000" (4f3b9d88-6545-4046-a9a8-62aed4d6ee9f) / Controller Instance ID d821f451-62e3-4187-53bb-dd51ceaeee2c running on Node ip-10-2-182-10.us-west-2.compute.internal (10.2.182.10), is ready for work (10.2.182.10:10000)
Preparing environment
Running on ip-192-168-64-23.us-west-2.compute.internal via ip-10-2-128-69.us-west-2.compute.internal...
Getting source from Git repository
$ pre-clone
[18:11:31]: Cloning repository...
Fetching changes...
Initialized empty Git repository in /Users/ionic-cloud-team/builds/sandroallada-png/mcf/.git/
Created fresh repository.
failed to store: -25308
Checking out e0e1337a as main...
Updating/initializing submodules...
$ post-clone
[18:11:32]: Cloning complete...
Executing "step_script" stage of the job script
$ pre-build
[18:11:33]: Building project....
$ fetch-updates || true
Checking for build process updates...
$ build-ios
Top level ::CompositeIO is deprecated, require 'multipart/post' and use `Multipart::Post::CompositeReadIO` instead!
Top level ::Parts is deprecated, require 'multipart/post' and use `Multipart::Post::Parts` instead!
[18:11:37]: ---------------------------------
[18:11:37]: --- Step: add_extra_platforms ---
[18:11:37]: ---------------------------------
[18:11:37]: Setting '[:web]' as extra SupportedPlatforms
[18:11:37]: ------------------------------
[18:11:37]: --- Step: default_platform ---
[18:11:37]: ------------------------------
[18:11:37]: Driving the lane 'ios build_capacitor' 🚀
[18:11:37]: ---------------------------------
[18:11:37]: --- Step: prepare_environment ---
[18:11:37]: ---------------------------------
[18:11:37]: Setting default environment variables to tidy up logs. These can be overridden by setting them in Appflow.
[18:11:37]: 
[18:11:37]: No changes needed - logs are already tidy! 🧹
[18:11:37]: -------------------------
[18:11:37]: --- Step: sentry_init ---
[18:11:37]: -------------------------
[18:11:37]: ----------------------------
[18:11:37]: --- Step: begin_building ---
[18:11:37]: ----------------------------
[18:11:37]: Began building @ 2026-04-10T18:11:37
[18:11:37]: ---------------------------
[18:11:37]: --- Step: build_summary ---
[18:11:37]: ---------------------------

+---------------------------------------------------+
|                   Build Summary                   |
+---------------------+-----------------------------+
| Runners Revision    | 4926248                     |
| Job ID              | 10857096                    |
| Node.js version     | v22.22.0                    |
| Cordova CLI version | 12.0.0 (cordova-lib@12.0.2) |
| npm version         | 10.9.4                      |
| yarn version        | 1.22.19                     |
| macOS version       | 15.6                        |
| Xcode version       | Xcode 26.2                  |
|                     | Build version 17C52         |
| Fastlane version    | fastlane (2.230.0)          |
+---------------------+-----------------------------+

[18:11:40]: -----------------------------
[18:11:40]: --- Step: create_keychain ---
[18:11:40]: -----------------------------
[18:11:40]: $ security list-keychains -d user
[18:11:40]: ▸ "/Users/ionic-cloud-team/Library/Keychains/login.keychain-db"
[18:11:40]: ------------------------------------------
[18:11:40]: --- Step: get_ios_credentials_from_api ---
[18:11:40]: ------------------------------------------
[18:11:40]: Fetching certificate and profile(s) from Ionic Appflow
[18:11:41]: ---------------------------------
[18:11:41]: --- Step: set_ios_credentials ---
[18:11:41]: ---------------------------------
[18:11:41]: Installing provisioning profile...
[18:11:41]: /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ca5009a3-c2f6-4a05-b7f1-1b719a43c05e.mobileprovision

+----------------------------------------------------------------------------+
|                           Installed Certificate                            |
+-------------------+--------------------------------------------------------+
| User ID           | KV825CMDG7                                             |
| Common Name       | iPhone Distribution: Setondji Maxy Djisso (KV825CMDG7) |
| Organization Unit | KV825CMDG7                                             |
| Organization      | Setondji Maxy Djisso                                   |
| Country           | FR                                                     |
+-------------------+--------------------------------------------------------+

[18:11:41]: --------------------------------
[18:11:41]: --- Step: import_certificate ---
[18:11:41]: --------------------------------
[18:11:41]: Setting key partition list... (this can take a minute if there are a lot of keys installed)
[18:11:41]: ---------------------------
[18:11:41]: --- Step: set_ionic_cli ---
[18:11:41]: ---------------------------
[18:11:42]: Preinstalled @ionic/cli compatible with project `custom`
[18:11:42]: ------------------------------------
[18:11:42]: --- Step: detect_package_manager ---
[18:11:42]: ------------------------------------
[18:11:42]: Detecting package manager
[18:11:42]: Defaulting to npm
[18:11:42]: ---------------------------------
[18:11:42]: --- Step: add_git_credentials ---
[18:11:42]: ---------------------------------
[18:11:42]: Writing git-credentials files
[18:11:42]: git-credentials successfully added to project
[18:11:42]: --------------------------------
[18:11:42]: --- Step: get_appflow_config ---
[18:11:42]: --------------------------------
[18:11:42]: Checking for appflow.config.json
[18:11:42]: Appflow config not detected
[18:11:42]: --------------------------------
[18:11:42]: --- Step: dependency_install ---
[18:11:42]: --------------------------------
[18:11:42]: Installing Dependencies (in /Users/ionic-cloud-team/builds/sandroallada-png/mcf)
[18:11:42]: $ npm ci --quiet 
[18:11:43]: ▸ npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[18:11:43]: ▸ npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
[18:11:43]: ▸ npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[18:11:43]: ▸ npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[18:11:43]: ▸ npm warn deprecated q@1.5.1: You or someone you depend on is using Q, the JavaScript Promise library that gave JavaScript developers strong feelings about promises. They can almost certainly migrate to the native JavaScript promise now. Thank you literally everyone for joining me in this bet against the odds. Be excellent to each other.
[18:11:43]: ▸ npm warn deprecated
[18:11:43]: ▸ npm warn deprecated (For a CapTP with native promises, see @endo/eventual-send and @endo/captp)
[18:11:43]: ▸ npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
[18:11:43]: ▸ npm warn deprecated tar@6.2.1: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[18:11:44]: ▸ npm warn deprecated @types/xlsx@0.0.36: This is a stub types definition for xlsx (https://github.com/sheetjs/js-xlsx). xlsx provides its own type definitions, so you don't need @types/xlsx installed!
[18:11:46]: ▸ npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*
[18:11:46]: ▸ npm warn deprecated @xmldom/xmldom@0.7.13: this version is no longer supported, please update to at least 0.8.*
[18:11:46]: ▸ npm warn deprecated glob@9.3.5: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
[18:11:59]: ▸ > my-cook-flex@0.1.0 postinstall
[18:11:59]: ▸ > bash scripts/fix-ios-signing.sh
[18:11:59]: ▸ --- MCF CUSTOM SIGNING FIX (from postinstall) START ---
[18:11:59]: ▸ Setting Team ID to KV825CMDG7...
[18:11:59]: ▸ Setting Manual Sign Style...
[18:11:59]: ▸ Disabling signing for dependencies...
[18:11:59]: ▸ --- MCF CUSTOM SIGNING FIX END ---
[18:11:59]: ▸ added 982 packages, and audited 983 packages in 17s
[18:11:59]: ▸ 186 packages are looking for funding
[18:11:59]: ▸ run `npm fund` for details
[18:11:59]: ▸ 22 vulnerabilities (2 low, 4 moderate, 14 high, 2 critical)
[18:11:59]: ▸ To address issues that do not require attention, run:
[18:11:59]: ▸ npm audit fix
[18:11:59]: ▸ To address all issues possible (including breaking changes), run:
[18:11:59]: ▸ npm audit fix --force
[18:11:59]: ▸ Some issues need review, and may require choosing
[18:11:59]: ▸ a different dependency.
[18:11:59]: ▸ Run `npm audit` for details.
[18:11:59]: -------------------------------------
[18:11:59]: --- Step: create_capacitor_config ---
[18:11:59]: -------------------------------------
[18:12:00]: Created capacitor.config.json from capacitor.config.ts/js
[18:12:00]: ----------------------------------------
[18:12:00]: --- Step: detect_ios_package_manager ---
[18:12:00]: ----------------------------------------
[18:12:00]: Detected SPM project (found /Users/ionic-cloud-team/builds/sandroallada-png/mcf/ios/App/CapApp-SPM)
[18:12:00]: Detected iOS package manager: spm
[18:12:00]: -------------------------
[18:12:00]: --- Step: get_web_dir ---
[18:12:00]: -------------------------
[18:12:00]: webDir is `out`
[18:12:00]: -----------------------------------
[18:12:00]: --- Step: modify_cap_web_config ---
[18:12:00]: -----------------------------------
[18:12:00]: No custom native config detected.
[18:12:00]: ---------------------------
[18:12:00]: --- Step: build_pro_app ---
[18:12:00]: ---------------------------
[18:12:00]: Building app from /Users/ionic-cloud-team/builds/sandroallada-png/mcf
[18:12:00]: Build script detected...
[18:12:00]: $ npm run build
[18:12:00]: ▸ > my-cook-flex@0.1.0 build
[18:12:00]: ▸ > next build
[18:12:00]: ▸ ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
[18:12:00]: ▸ ⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
[18:12:00]: ▸ Attention: Next.js now collects completely anonymous telemetry regarding usage.
[18:12:00]: ▸ This information is used to shape Next.js' roadmap and prioritize features.
[18:12:00]: ▸ You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[18:12:00]: ▸ https://nextjs.org/telemetry
[18:12:00]: ▸ ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
[18:12:00]: ▸ ▲ Next.js 15.3.8
[18:12:00]: ▸ - Environments: .env
[18:12:00]: ▸   Creating an optimized production build ...
[18:12:16]: ▸ warn - The class `duration-[2s]` is ambiguous and matches multiple utilities.
[18:12:16]: ▸ warn - If this is content and not a class, replace it with `duration-&lsqb;2s&rsqb;` to silence this warning.
[18:12:21]: ▸ ✓ Compiled successfully in 21.0s
[18:12:22]: ▸   Skipping validation of types
[18:12:22]: ▸   Skipping linting
[18:12:22]: ▸   Collecting page data ...
[18:12:22]: ▸ > Build error occurred
[18:12:22]: ▸ [Error: Page "/join-family/[inviteId]" is missing "generateStaticParams()" so it cannot be used with "output: export" config.]
[18:12:22]: -------------------------
[18:12:22]: --- Step: upload_logs ---
[18:12:22]: -------------------------
[18:12:26]: --------------------------------------
[18:12:26]: --- Step: sentry_capture_exception ---
[18:12:26]: --------------------------------------
[18:12:26]: ---------------------------
[18:12:26]: --- Step: shell command ---
[18:12:26]: ---------------------------
[18:12:26]: Exit status of command 'npm run build' was 1 instead of 0.

> my-cook-flex@0.1.0 build
> next build

 ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

 ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
   ▲ Next.js 15.3.8
   - Environments: .env

   Creating an optimized production build ...

warn - The class `duration-[2s]` is ambiguous and matches multiple utilities.
warn - If this is content and not a class, replace it with `duration-&lsqb;2s&rsqb;` to silence this warning.
 ✓ Compiled successfully in 21.0s
   Skipping validation of types
   Skipping linting
   Collecting page data ...

> Build error occurred
[Error: Page "/join-family/[inviteId]" is missing "generateStaticParams()" so it cannot be used with "output: export" config.]

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
[18:12:26]: Exit status of command 'npm run build' was 1 instead of 0.

> my-cook-flex@0.1.0 build
> next build

 ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

 ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
   ▲ Next.js 15.3.8
   - Environments: .env

   Creating an optimized production build ...

warn - The class `duration-[2s]` is ambiguous and matches multiple utilities.
warn - If this is content and not a class, replace it with `duration-&lsqb;2s&rsqb;` to silence this warning.
 ✓ Compiled successfully in 21.0s
   Skipping validation of types
   Skipping linting
   Collecting page data ...

> Build error occurred
[Error: Page "/join-family/[inviteId]" is missing "generateStaticParams()" so it cannot be used with "output: export" config.]


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
| 15   | dependency_install           | 17          |
| 16   | create_capacitor_config      | 0           |
| 17   | detect_ios_package_manager   | 0           |
| 18   | get_web_dir                  | 0           |
| 19   | modify_cap_web_config        | 0           |
| 💥   | build_pro_app                | 22          |
| 21   | upload_logs                  | 3           |
| 22   | sentry_capture_exception     | 0           |
| 23   | shell command                | 0           |
+------+------------------------------+-------------+

[18:12:26]: fastlane finished with errors
/opt/homebrew/Cellar/fastlane/2.230.0_1/libexec/bin/fastlane: [!] Exit status of command 'npm run build' was 1 instead of 0. (FastlaneCore::Interface::FastlaneShellError)

> my-cook-flex@0.1.0 build
> next build

 ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

 ⚠ Specified "headers" will not automatically work with "output: export". See more info here: https://nextjs.org/docs/messages/export-no-custom-routes
   ▲ Next.js 15.3.8
   - Environments: .env

   Creating an optimized production build ...

warn - The class `duration-[2s]` is ambiguous and matches multiple utilities.
warn - If this is content and not a class, replace it with `duration-&lsqb;2s&rsqb;` to silence this warning.
 ✓ Compiled successfully in 21.0s
   Skipping validation of types
   Skipping linting
   Collecting page data ...

> Build error occurred
[Error: Page "/join-family/[inviteId]" is missing "generateStaticParams()" so it cannot be used with "output: export" config.]

Running after_script
Running after script...
$ clean-up
Cleaning up project directory and file based variables
Terminating VM: build_stack_2026.01_arm64-1775844659672214000 (4f3b9d88-6545-4046-a9a8-62aed4d6ee9f) | Controller Instance ID: d821f451-62e3-4187-53bb-dd51ceaeee2c | Host: 10.2.182.10
ERROR: Job failed: Process exited with status 1