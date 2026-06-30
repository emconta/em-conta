import type { ReactMaskOpts } from "react-imask";

export const emailMask = {
  mask: /^([a-zA-Z0-9_.@]*)$/,
} satisfies ReactMaskOpts;
