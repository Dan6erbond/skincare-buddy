import colors from "tailwindcss/colors";
import { convert } from "colorizr";
import { heroui } from "@heroui/react";
import { readableColor } from "color2k";

const rose = Object.fromEntries(
  Object.entries(colors.rose).map(([key, color]) => [
    key,
    convert(color, "hex"),
  ])
);

const teal = Object.fromEntries(
  Object.entries(colors.teal).map(([key, color]) => [
    key,
    convert(color, "hex"),
  ])
);

export default heroui({
  themes: {
    light: {
      colors: {
        primary: {
          ...rose,
          foreground: readableColor(rose[700]),
          DEFAULT: rose[600],
        },
        secondary: {
          ...teal,
          foreground: readableColor(teal[600]),
          DEFAULT: teal[600],
        },
      },
    },
    dark: {
      colors: {
        primary: {
          ...rose,
          foreground: readableColor(rose[700]),
          DEFAULT: rose[600],
        },
        secondary: {
          ...teal,
          foreground: readableColor(teal[600]),
          DEFAULT: teal[600],
        },
      },
    },
  },
});
