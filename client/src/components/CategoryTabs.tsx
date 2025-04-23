import { useLanguage } from "@/hooks/useLanguage";
import {
  Cloud,
  Calendar,
  Network,
  Building2,
  Film,
  Map,
  Utensils,
  Users,
} from "lucide-react";

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasValidZipCode?: boolean; // Indica si hay un código postal válido
}

export default function CategoryTabs({ activeTab, onTabChange, hasValidZipCode = false }: CategoryTabsProps) {
  const { language } = useLanguage();

  const tabs = [
    {
      id: "weather",
      icon: <Cloud className="text-blue-400" />,
      label: language === 'es' ? "Clima" : "Weather",
    },
    {
      id: "events",
      icon: <Calendar className="text-purple-400" />,
      label: language === 'es' ? "Eventos" : "Events",
    },
    {
      id: "recreation",
      icon: <Network className="text-green-400" />,
      label: language === 'es' ? "Recreación" : "Recreation",
    },
    {
      id: "restaurants",
      icon: <Utensils className="text-red-400" />,
      label: language === 'es' ? "Restaurantes" : "Restaurants",
    },
    {
      id: "banks",
      icon: <Building2 className="text-yellow-400" />,
      label: language === 'es' ? "Bancos" : "Banks",
    },
    {
      id: "entertainment",
      icon: <Film className="text-pink-400" />,
      label: language === 'es' ? "Entretenimiento" : "Entertainment",
    },
    {
      id: "journey",
      icon: <Map className="text-indigo-400" />,
      label: language === 'es' ? "Viajes" : "Journeys",
    },
    {
      id: "meeting-points",
      icon: <Users className="text-teal-400" />,
      label: language === 'es' ? "Puntos de Encuentro" : "Meeting Points",
    },
  ];

  return (
    <nav className="bg-[#1a1a1a] border-t border-[#333]">
      <div className="container mx-auto">
        <ul className="flex overflow-x-auto md:justify-center">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                className={`px-4 py-3 flex flex-col items-center whitespace-nowrap border-b-2 focus:outline-none ${
                  activeTab === tab.id ? "active-tab" : "inactive-tab"
                } ${!hasValidZipCode ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => hasValidZipCode && onTabChange(tab.id)}
                disabled={!hasValidZipCode}
                title={!hasValidZipCode ? (language === 'es' ? 'Ingresa un código postal primero' : 'Enter a ZIP code first') : ''}
              >
                {tab.icon}
                <span className="text-sm mt-1 text-gray-300">{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
