[06:47:30]: -------------------------------------
[06:47:30]: --- Step: upload_ipa_to_app_store ---
[06:47:30]: -------------------------------------
[06:47:34]: Could not get providers from altool.
[06:47:34]: Team ID supplied (KV825CMDG7) does not appear to be the Team ID or Shortname of a team of which you are a member. Not using it for upload.
[06:47:34]: Ready to upload new build to TestFlight (App: 6761531346)...
[06:47:34]: Fetching password for transporter from environment variable named `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD`
[06:47:34]: Going to upload updated app to App Store Connect
[06:47:34]: This might take a few minutes. Please don't interrupt the script.
[06:47:37]: [altool] Running altool at path '/Applications/Xcode.app/Contents/SharedFrameworks/ContentDelivery.framework/Resources/altool'...

[06:47:37]: [altool] 

[06:47:37]: [altool] 2026-04-05 06:47:37.347 ERROR: [ContentDelivery.Uploader.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)

[06:47:37]: [altool]    NSUnderlyingError : The provided entity includes an attribute with a value that has already been used (-19241) The bundle version must be higher than the previously uploaded version.

[06:47:37]: [altool]       status : 409

[06:47:37]: [altool]       detail : The bundle version must be higher than the previously uploaded version.

[06:47:37]: [altool]       source : 

[06:47:37]: [altool]          pointer : /data/attributes/cfBundleVersion

[06:47:37]: [altool]       id : 947eed30-1321-4ffc-b1c0-ad2670599b7b

[06:47:37]: [altool]       code : ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE

[06:47:37]: [altool]       title : The provided entity includes an attribute with a value that has already been used

[06:47:37]: [altool]       meta : 

[06:47:37]: [altool]          previousBundleVersion : 1

[06:47:37]: [altool]    previousBundleVersion : 1

[06:47:37]: [altool]    iris-code : ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE

[06:47:37]: [altool] 2026-04-05 06:47:37.347 ERROR: [altool.600001850440] Failed to upload package.

[06:47:37]: [altool] Failed to upload archive at '/var/folders/gc/gp_6bpzd1xldy_rrty299f980000gn/T/b44124ee-d9f7-4ecc-8796-9a7f1427a7c7.ipa'.

[06:47:37]: [altool] 2026-04-05 06:47:37.348 ERROR: [altool.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)

[06:47:37]: [altool]    NSUnderlyingError : The provided entity includes an attribute with a value that has already been used (-19241) The bundle version must be higher than the previously uploaded version.

[06:47:37]: [altool]       status : 409

[06:47:37]: [altool]       detail : The bundle version must be higher than the previously uploaded version.

[06:47:37]: [altool]       source : 

[06:47:37]: [altool]          pointer : /data/attributes/cfBundleVersion

[06:47:37]: [altool]       id : 947eed30-1321-4ffc-b1c0-ad2670599b7b

[06:47:37]: [altool]       code : ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE

[06:47:37]: [altool]       title : The provided entity includes an attribute with a value that has already been used

[06:47:37]: [altool]       meta : 

[06:47:37]: [altool]          previousBundleVersion : 1

[06:47:37]: [altool]    previousBundleVersion : 1

[06:47:37]: [altool]    iris-code : ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE

[06:47:37]: [altool] 

[06:47:37]: Application Loader output above ^
[06:47:37]: [ContentDelivery.Uploader.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)

[06:47:37]: [altool.600001850440] Failed to upload package.
[06:47:37]: [altool.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)

[06:47:37]: Could not download/upload from App Store Connect!
[06:47:37]: Failed to upload to App Store: Error uploading ipa file: 
 [Application Loader Error Output]: [ContentDelivery.Uploader.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)
[Application Loader Error Output]: [altool.600001850440] Failed to upload package.
[Application Loader Error Output]: [altool.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)
[06:47:37]: Failed to execute action after 1 attempts because: Error uploading ipa file: 
 [Application Loader Error Output]: [ContentDelivery.Uploader.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)
[Application Loader Error Output]: [altool.600001850440] Failed to upload package.
[Application Loader Error Output]: [altool.600001850440] The provided entity includes an attribute with a value that has already been used (-19232) The bundle version must be higher than the previously uploaded version: ‘1’. (ID: 947eed30-1321-4ffc-b1c0-ad2670599b7b)