import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface LocationInfoProps {
  locationName: string;
  zipCode: string;
  onRefresh: () => void;
}

export default function LocationInfo({ 
  locationName, 
  zipCode, 
  onRefresh 
}: LocationInfoProps) {
  const { language } = useLanguage();

  const zipCodeLabel = language === 'es' 
    ? "Código postal: " 
    : "ZIP code: ";
  
  const refreshLabel = language === 'es'
    ? "Actualizar"
    : "Refresh";

  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold gradient-text">{locationName}</h2>
        <p className="text-sm text-gray-400">{zipCodeLabel}{zipCode}</p>
      </div>
      <Button
        variant="ghost"
        className="text-blue-400 hover:text-blue-300 hover:bg-[#252525]"
        onClick={onRefresh}
      >
        <RefreshCcw className="h-4 w-4 mr-1" /> {refreshLabel}
      </Button>
    </div>
  );
}
