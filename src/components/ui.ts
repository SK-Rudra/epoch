// Shared form styles, so every form in the app looks and behaves the same.
// Borders use graphite/80: the lightest that still passes the 3:1 contrast rule for controls in both themes.
export const inputClass =
  "w-full rounded-md border border-graphite/80 bg-raised px-3 py-2 text-ink transition-colors duration-150 hover:border-ink";

export const buttonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 font-medium text-paper transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-60";
