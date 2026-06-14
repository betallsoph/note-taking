import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { VisualizerConfig } from "../types";
import { getGroupedVisualizers } from "../config/registry";

interface VisualizationSidebarProps {
  selectedId: string;
  onSelect: (config: VisualizerConfig) => void;
  className?: string;
}

export function VisualizationSidebar({
  selectedId,
  onSelect,
  className,
}: VisualizationSidebarProps) {
  const groups = useMemo(() => getGroupedVisualizers(), []);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden border-r bg-card/50",
        className,
      )}
    >
      <div className="shrink-0 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Visualizations</h2>
        <p className="text-xs text-muted-foreground">
          Data structures and algorithms
        </p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 h-[500px]">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      selectedId === item.id
                        ? "bg-primary/15 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
