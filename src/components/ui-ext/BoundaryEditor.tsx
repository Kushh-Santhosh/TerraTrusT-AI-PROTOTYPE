import { RealMap } from "./RealMap";
import type { LatLng } from "@/lib/gis-utils";

export interface BoundaryEditorProps {
  initialCenter: LatLng;
  boundary: LatLng[];
  onChange: (boundary: LatLng[], areaSqm: number) => void;
  onLocationChange?: (center: LatLng) => void;
  onAddressSelect?: (res: any) => void;
  className?: string;
  readOnly?: boolean;
}

export function BoundaryEditor({
  initialCenter,
  boundary,
  onChange,
  onLocationChange,
  onAddressSelect,
  className = "",
  readOnly = false,
}: BoundaryEditorProps) {
  return (
    <RealMap
      initialCenter={initialCenter}
      boundary={boundary}
      onChange={onChange}
      onLocationChange={onLocationChange}
      onAddressSelect={onAddressSelect}
      className={className}
      readOnly={readOnly}
      height={460}
    />
  );
}
