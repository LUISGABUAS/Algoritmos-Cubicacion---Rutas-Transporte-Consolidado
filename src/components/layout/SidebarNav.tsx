import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Truck,
  Map,
  ClipboardList,
  Users,
  Building2,
  BarChart2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/dashboard",   label: "Dashboard",      icon: LayoutDashboard },
  { href: "/packages",    label: "Paquetes",        icon: Package },
  { href: "/trailers",    label: "Tráileres",       icon: Truck },
  { href: "/routes",      label: "Rutas",           icon: Map },
  { href: "/operations",  label: "Operaciones",     icon: ClipboardList },
  { href: "/drivers",     label: "Conductores",     icon: Users },
  { href: "/clients",     label: "Clientes",        icon: Building2 },
  { href: "/reports",     label: "Reportes",        icon: BarChart2 },
  { href: "/settings",    label: "Configuración",   icon: Settings },
];

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Tooltip key={href} delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to={href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  "text-white/60 hover:bg-white/10 hover:text-white",
                  isActive && "bg-white/10 text-white border-l-2 border-brand-orange rounded-l-none pl-[10px]"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">
              {label}
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </nav>
  );
}
