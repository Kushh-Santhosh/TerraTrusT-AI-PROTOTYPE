import { RealMap } from "./RealMap";
import type { LatLng } from "@/lib/gis-utils";
import type { NominatimResult } from "./RealMap";

export interface BoundaryEditorProps {
  initialCenter: LatLng;
  boundary: LatLng[];
  onChange: (boundary: LatLng[], areaSqm: number) => void;
  onLocationChange?: (center: LatLng) => void;
  onAddressSelect?: (res: NominatimResult) => void;
  className?: string;
  readOnly?: boolean;
  stateCode?: string;
}

export function BoundaryEditor({
  initialCenter,
  boundary,
  onChange,
  onLocationChange,
  onAddressSelect,
  className = "",
  readOnly = false,
  stateCode,
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
      stateCode={stateCode}
    />
  );
}
