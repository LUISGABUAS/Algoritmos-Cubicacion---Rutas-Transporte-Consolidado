import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PackageForm } from "@/features/packages/components/PackageForm";

export default function PackageFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2">
        <Link
          to="/packages"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Paquetes
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium text-foreground">
          {isEdit ? `Editar ${id}` : "Nuevo paquete"}
        </span>
      </div>

      <PackageForm packageId={id} />
    </div>
  );
}
