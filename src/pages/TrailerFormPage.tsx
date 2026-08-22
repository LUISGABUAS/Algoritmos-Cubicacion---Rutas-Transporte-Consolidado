import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { TrailerForm } from "@/features/trailers/components/TrailerForm";

export default function TrailerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-2">
        <Link
          to="/trailers"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Tráileres
        </Link>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium text-foreground">
          {isEdit ? `Editar ${id}` : "Nuevo tráiler"}
        </span>
      </div>

      <TrailerForm trailerId={id} />
    </div>
  );
}
