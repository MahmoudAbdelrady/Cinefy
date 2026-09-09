import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  type InputSignal,
  signal,
  viewChild,
} from "@angular/core";
import { LucideDynamicIcon, LucideIcon } from "@lucide/angular";
import { ClapperboardIcon } from "../icons";

@Component({
  selector: "cui-media-image",
  imports: [LucideDynamicIcon],
  templateUrl: "./cinefy-media-image.html",
  styleUrl: "./cinefy-media-image.scss",
})
export class CinefyMediaImage {
  private readonly imageRef = viewChild<ElementRef<HTMLImageElement>>("image");

  readonly src: InputSignal<string | undefined> = input<string | undefined>();
  readonly alt = input("");
  readonly loading = input<"lazy" | "eager">("lazy");
  readonly icon = input<LucideIcon>(ClapperboardIcon);
  readonly iconSize = input(28);

  protected readonly loaded = signal(false);
  protected readonly errored = signal(false);

  protected readonly showImage = computed(() => !!this.src() && !this.errored());

  constructor() {
    effect(() => {
      this.src();
      this.loaded.set(false);
      this.errored.set(false);
    });

    afterNextRender(() => {
      const image = this.imageRef()?.nativeElement;
      if (image?.complete && image.naturalWidth > 0) {
        this.loaded.set(true);
      }
    });
  }

  protected onLoad() {
    this.loaded.set(true);
  }

  protected onError() {
    this.errored.set(true);
  }
}
