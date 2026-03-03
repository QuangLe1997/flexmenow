/**
 * FlexMe Cloud Functions — Entry Point
 *
 * All Cloud Functions Gen 2 are exported from this file.
 * Firebase CLI discovers and deploys functions from here.
 *
 * Functions:
 *  - genFlexShot:           Callable — Single AI image generation (FlexShot)
 *  - genFlexTale:           Callable — Multi-scene AI story generation (FlexTale)
 *  - checkGeo:              Callable — Geo detection from IP/headers
 *  - handleEventRevenueCat: HTTPS    — RevenueCat webhook handler
 *  - onUserCreate:          Auth     — New user setup (blocking beforeUserCreated)
 */

export { genFlexShot } from "./functions/gen_flexshot";
export { genFlexTale } from "./functions/gen_flextale";
export { genFlexLocket } from "./functions/gen_flexlocket";
export { checkGeo } from "./functions/check_geo";
export { handleEventRevenueCat } from "./functions/handle_revenuecat";
export { onUserCreate } from "./functions/on_user_create";
