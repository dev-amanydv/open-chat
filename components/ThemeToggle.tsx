"use client";

import { useTheme } from "next-themes";
import { FiSun, FiMoon } from "react-icons/fi";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="oc-nav-item oc-focus" aria-label="Toggle theme">
        <FiSun className="size-[19px]" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="oc-nav-item oc-focus"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <FiSun className="size-[19px]" />
      ) : (
        <FiMoon className="size-[19px]" />
      )}
    </button>
  );
}
