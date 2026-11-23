/**
 * Central payment/checkout configuration for Simpletide.
 *
 * Flip `CARD_PROCESSING_LIVE` to `true` once a card processor is approved and
 * wired into `supabase/functions/create-card-order/index.ts`. While `false`,
 * checkout refuses to transmit card numbers anywhere and displays a clean
 * pending-processing notice.
 */
export const CARD_PROCESSING_LIVE = false;

/** Order number prefix for all Simpletide orders (e.g. ST-M9K3X2). */
export const ORDER_PREFIX = "ST";
