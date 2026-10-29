import { Check, Palette } from "lucide-react";
import { THEMES, useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Palette className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-3 py-2"
          >
            <span className="flex -space-x-1">
              {t.swatch.map((c) => (
                <span
                  key={c}
                  className="border-background size-4 rounded-full border-2"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className="text-muted-foreground block text-xs">{t.hint}</span>
            </span>
            {theme === t.id && <Check className="text-primary size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
