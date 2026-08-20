import { Menu, Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentRoute } from "@/hooks/useCurrentRoute";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { title, breadcrumbs } = useCurrentRoute();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-6 shrink-0">
      {/* Mobile menu trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-muted-foreground hover:text-foreground"
        onClick={onMobileMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title + Breadcrumbs */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        {breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-foreground transition-colors truncate">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-base font-semibold text-foreground leading-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-brand-orange border-0">
            2
          </Badge>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-muted">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy">
                <span className="text-[11px] font-semibold text-white">LG</span>
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">Luis G.</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Luis G.</p>
                <p className="text-xs text-muted-foreground">Operador</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
