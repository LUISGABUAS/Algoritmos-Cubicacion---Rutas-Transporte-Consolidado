import { Truck, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav } from "./SidebarNav";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col h-screen bg-navy border-r border-white/10 transition-all duration-300 shrink-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-4 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange shrink-0">
          <Truck className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white leading-tight truncate">LogiTrack</p>
            <p className="text-[11px] text-white/40 truncate">Gestión logística</p>
          </div>
        )}
      </div>

      <Separator className="bg-white/10 shrink-0" />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <SidebarNav collapsed={collapsed} />
      </ScrollArea>

      <Separator className="bg-white/10 shrink-0" />

      {/* User + Logout */}
      <div className="p-2 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shrink-0">
              <span className="text-xs font-semibold text-white">LG</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Luis G.</p>
              <p className="text-[11px] text-white/40 truncate">Operador</p>
            </div>
          </div>
        )}

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Cerrar sesión</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-navy text-white/60 hover:text-white transition-colors shadow-md"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
