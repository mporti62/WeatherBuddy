import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { MapPin } from "lucide-react";

interface InitialStateProps {
  onUseLocation: () => void;
}

export default function InitialState({ onUseLocation }: InitialStateProps) {
  const { language } = useLanguage();

  const texts = {
    welcome: language === 'es' 
      ? "Bienvenido a LocaInfo" 
      : "Welcome to LocaInfo",
    description: language === 'es'
      ? "Ingresa tu código postal para descubrir información útil sobre el clima, eventos sociales, lugares de recreación, bancos y sugerencias de entretenimiento en tu área."
      : "Enter your ZIP code to discover useful information about weather, social events, recreation places, banks, and entertainment suggestions in your area.",
    useLocation: language === 'es'
      ? "Usar mi ubicación"
      : "Use my location"
  };

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="dark-card p-8 rounded-lg shadow-lg mb-6 flex items-center justify-center border border-[#333] bg-[#1a1a1a]">
          <MapPin size={80} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-4 gradient-text">{texts.welcome}</h2>
        <p className="mb-6 text-gray-300">{texts.description}</p>
        <div className="flex justify-center space-x-4">
          <Button 
            className="dark-button px-6 py-3 rounded-lg"
            onClick={onUseLocation}
          >
            <MapPin className="mr-2 h-4 w-4" /> {texts.useLocation}
          </Button>
        </div>
      </div>
    </div>
  );
}
