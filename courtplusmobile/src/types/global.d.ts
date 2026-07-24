/**
 * Compatibility shim for libraries that still reference the global JSX
 * namespace (removed from React 19 types in favor of `React.JSX`).
 * Currently required by react-native-country-codes-picker.
 */
import type { JSX as ReactJSX } from "react";

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
  }
}

export {};
