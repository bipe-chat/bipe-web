// The App Store screenshot sets Bipe ships (bipe-chat/bipe#454). The one source for their sizes:
// the store image builder (scripts/store-images.mjs, bipe-chat/bipe#455) imports it for the panel size
// and checks each capture in appstore/raw against it. Moved from bipe-ios (archived) on 26 October 2026.
// Rules from App Store Connect: PNG, RGB with no alpha, exact pixels, 1 to 10 images per set.
// ASC scales the smaller iPhone and iPad sets from these two.
// `screenRadius` is the corner radius of the screen in capture pixels, for a continuous corner with
// smoothing 0.6 (bipe-web scripts/lib/squircle.mjs). Fitted to the simulator's framebufferMask PDF
// (CoreSimulator/Profiles/DeviceTypes/<simulator>.simdevicetype, profile.plist) on 20 October 2026.

export const DEVICES = {
  iphone69: {
    label: 'iPhone 6.9"',
    ascDeviceType: "IPHONE_69",
    // App Store Connect API screenshotDisplayType. The 6.9" set keeps the API name of the 6.7" slot.
    ascScreenshotType: "APP_IPHONE_67",
    simulator: "iPhone 17 Pro Max",
    kind: "phone",
    width: 1320,
    height: 2868,
    screenRadius: 190,
  },
  ipad13: {
    label: 'iPad 13"',
    ascDeviceType: "IPAD_PRO_3GEN_129",
    ascScreenshotType: "APP_IPAD_PRO_3GEN_129",
    simulator: "iPad Pro 13-inch (M5)",
    kind: "tablet",
    width: 2064,
    height: 2752,
    screenRadius: 60,
  },
};

export const DEVICE_KEYS = Object.keys(DEVICES);

export function device(key) {
  const found = DEVICES[key];
  if (!found) throw new Error(`Unknown device "${key}". Known: ${DEVICE_KEYS.join(", ")}`);
  return { key, ...found };
}
