import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface DarkModeToggleProps {
  isDark: boolean;
  toggleDarkMode: () => void;
}

export function DarkModeToggle({
  isDark,
  toggleDarkMode,
}: DarkModeToggleProps) {
  const [show, setShow] = useState(false);

  // Show button after scrolling down 100px
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null; // hide before scrolling

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="fixed top-6 right-6 z-50 bg-white/90 dark:bg-stone-800/90 backdrop-blur-lg hover:bg-stone-100 dark:hover:bg-stone-700 shadow-lg rounded-full h-11 w-11 border border-stone-200 dark:border-stone-700/50 transition-all hover:scale-105"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500 transition-transform rotate-0" />
      ) : (
        <Moon className="h-5 w-5 text-stone-700 transition-transform rotate-0" />
      )}
    </Button>
  );
}
