import { Component } from "@angular/core";
import { Toast } from "primeng/toast";
import { CINEFY_TOAST_KEY, CINEFY_TOAST_LIFE } from "cinefy-ui/constants";

@Component({
  selector: "cinefy-toast",
  imports: [Toast],
  templateUrl: "./cinefy-toast.html",
})
export class CinefyToast {
  protected readonly toastKey = CINEFY_TOAST_KEY;
  protected readonly toastLife = CINEFY_TOAST_LIFE;
}
