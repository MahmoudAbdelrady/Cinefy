import { Component, computed, input, viewChild } from "@angular/core";
import { LucideDynamicIcon, type LucideIcon } from "@lucide/angular";
import { Menu } from "primeng/menu";
import type { MenuItem } from "primeng/api";
import type { CinefyMenuGroup, CinefyMenuItem } from "cinefy-ui/types";
import { CinefyLoadingSpinner } from "../loading-spinner/cinefy-loading-spinner";

interface CinefyMenuModelItem extends MenuItem {
  lucideIcon: LucideIcon;
  loading: boolean;
}

interface CinefyMenuModelGroup extends MenuItem {
  items?: CinefyMenuModelItem[];
}

@Component({
  selector: "cui-menu",
  imports: [Menu, LucideDynamicIcon, CinefyLoadingSpinner],
  templateUrl: "./cinefy-menu.html",
  styleUrl: "./cinefy-menu.scss",
})
export class CinefyMenu {
  private readonly menu = viewChild.required<Menu>("menu");

  readonly items = input.required<CinefyMenuGroup[]>();

  protected readonly model = computed<CinefyMenuModelGroup[]>(() =>
    this.items().flatMap((group, index) => {
      const mapped: CinefyMenuModelGroup = {
        label: group.label,
        items: group.items.map((item) => this.toModelItem(item)),
      };
      return index < this.items().length - 1 ? [mapped, { separator: true }] : [mapped];
    }),
  );

  toggle(event: Event) {
    this.menu().toggle(event);
  }

  private toModelItem(item: CinefyMenuItem): CinefyMenuModelItem {
    const loading = item.loading?.() ?? false;
    return {
      label: item.label,
      lucideIcon: item.icon,
      loading,
      disabled: (item.disabled ?? false) || loading,
      command: () => item.action(),
    };
  }
}
