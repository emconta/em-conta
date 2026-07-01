import type { ReactMaskOpts } from "react-imask";

export const cnpjMask = {
  mask: "aa.aaa.aaa/0000-00",
  definitions: {
    a: /[A-Za-z0-9]/,
  },
  placeholderChar: "_",
  prepare: (value: string) => value.toUpperCase(),
} satisfies ReactMaskOpts;

export const emailMask = {
  mask: /^([a-zA-Z0-9_.@]*)$/,
} satisfies ReactMaskOpts;
