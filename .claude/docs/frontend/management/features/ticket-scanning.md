# Ticket scanning (`scan-ticket-modal`)

Verifies a ticket by booking reference — typed by hand or from a keyboard-wedge barcode scanner ("Listening for scanner input"); there's no camera code. It calls `POST /booking/tickets/:ref/scan`.

`scan-ticket-modal` is used in **two** places, so it renders **no** `<cui-dialog>` of its own, despite the name:

- **`/movies`** — the page wraps it in a `<cui-dialog>` behind `@if (scanTicketVisible())`.
- **Dashboard (usher)** — rendered inline in a plain card.

Both hosts read the component's `modalTitle()` / `modalDescription()` through a `#scanTicket` template reference, so the header text ("Scan ticket" → "Ticket info") stays in one place; `/movies` also reads `scanning()` for the dialog's `[canClose]`. Those members are **public** for that reason — a template ref can only reach public members. It works because projected content lives in the **parent's** template scope, so the ref is visible to the surrounding `cui-dialog`'s inputs.

Its `close` input is `input<(() => void) | null>(null)`, not required: the dashboard has nothing to close, so the Cancel/Close button is wrapped in `@if (close(); as close)`, and `.stm-actions` centers the remaining button via `&:has(> :only-child)`. `/movies` passes a `closeScanTicket` arrow field that calls `dialog().close()` on a `viewChild(CinefyDialog)` — going through the dialog (not the parent flag) runs the leave animation and PrimeNG's scroll-lock cleanup. The buttons render in the dialog **body**, not a footer slot.
