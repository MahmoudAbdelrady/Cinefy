import { provideToastConfig, type NgpToastConfig } from "ng-primitives/toast";

const DEFAULTS: Partial<NgpToastConfig> = {
  placement: "top-center",
  duration: 4000,
  offsetBottom: 24,
  offsetRight: 24,
  dismissible: true,
  maxToasts: 5,
  gap: 8,
  zIndex: 9999,
};

export function provideCinefyToast(overrides: Partial<NgpToastConfig> = {}) {
  return provideToastConfig({ ...DEFAULTS, ...overrides });
}
