/** Shared Inter typography + neutral palette for the account area (matches address drawer). */
export const ACCOUNT_FONT =
  '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const accountPageClass = "min-h-screen flex flex-col text-[15px] text-neutral-900 antialiased";

export const accountNavItem =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-3 rounded-2xl p-2.5 text-left text-[15px] font-medium transition-colors md:w-full md:justify-start md:rounded-full md:px-4 md:py-2.5";

export const accountNavActive = "bg-[#e5e7eb] text-neutral-900";
export const accountNavIdle = "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900";

export const accountPageTitle = "text-[24px] font-semibold tracking-normal text-neutral-900 md:text-[28px]";
export const accountPageSubtitle = "mt-1 text-[15px] leading-snug text-neutral-500";

export const accountSectionTitle = "text-[18px] font-semibold text-neutral-900";
export const accountSectionSubtitle = "mt-1 text-[15px] leading-snug text-neutral-500";

export const accountCard = "rounded-xl border border-neutral-200 bg-white";

/** Empty-state panels (no orders, etc.) — soft blue glow like Peptora. */
export const accountEmptyStateCard =
  "rounded-2xl border border-[rgba(167,139,250,0.14)] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_40px_rgba(167,139,250,0.08)]";

export const accountBreadcrumb = "cursor-pointer text-[13px] text-neutral-400 transition-colors hover:text-neutral-600";
export const accountBreadcrumbCurrent = "text-[13px] text-neutral-600";

export const accountBody = "text-[15px] text-neutral-700";
export const accountMuted = "text-[15px] text-neutral-500";
export const accountCaption = "text-[13px] text-neutral-500";
export const accountLabel = "text-[13px] font-semibold text-neutral-800";

export const accountLink = "cursor-pointer text-[15px] font-medium text-[#7c3aed] hover:underline";

export const CTA_GRADIENT =
  "bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white transition-all hover:brightness-110 disabled:opacity-60";

/** Default profile avatar circle — same blue gradient as CTAs. */
export const AVATAR_GRADIENT =
  "bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white";

export const CTA_BUTTON = `inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold ${CTA_GRADIENT}`;
