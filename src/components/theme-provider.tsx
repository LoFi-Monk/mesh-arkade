"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

/**
 * Global theme provider for the application.
 *
 * @intent provide theme context (light/dark/system) to all child components.
 * @guarantee Wraps next-themes Provider with project-specific configuration.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
