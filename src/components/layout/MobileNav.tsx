import { Truck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./SidebarNav";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0 bg-navy border-r border-white/10">
        <SheetHeader className="flex h-16 flex-row items-center gap-3 px-4 space-y-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange shrink-0">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <div>
            <SheetTitle className="text-sm font-semibold text-white text-left">LogiTrack</SheetTitle>
            <p className="text-[11px] text-white/40">Gestión logística</p>
          </div>
        </SheetHeader>

        <Separator className="bg-white/10" />

        <div className="py-3" onClick={onClose}>
          <SidebarNav collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
