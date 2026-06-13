import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "duration" })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined, fallback = "—"): string {
    if (minutes === null || minutes === undefined || minutes <= 0) return fallback;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
}
