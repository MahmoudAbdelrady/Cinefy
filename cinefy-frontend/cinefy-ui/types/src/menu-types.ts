import type { Signal } from "@angular/core";
import type { LucideIcon } from "@lucide/angular";

export interface CinefyMenuItem {
  icon: LucideIcon;
  label: string;
  action: () => void;
  loading?: Signal<boolean>;
  disabled?: boolean;
}

export interface CinefyMenuGroup {
  label?: string;
  items: CinefyMenuItem[];
}
