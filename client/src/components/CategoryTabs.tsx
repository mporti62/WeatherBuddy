import { useLanguage } from "@/hooks/useLanguage";
import {
  Cloud,
  Calendar,
  Network,
  Building2,
  Film,
  Map,
} from "lucide-react";

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function CategoryTabs({ activeTab, onTabChange }: CategoryTabsProps) {
  const { language } = useLanguage();

  const tabs = [
    {
      id: "weather",
      icon: <Cloud className="text-primary" />,
      label: language === 'es' ? "Clima" : "Weather",
    },
    {
      id: "events",
      icon: <Calendar className="text-secondary" />,
      label: language === 'es' ? "Eventos" : "Events",
    },
    {
      id: "recreation",
      icon: <Network className="text-accent" />,
      label: language === 'es' ? "Recreación" : "Recreation",
    },
    {
      id: "banks",
      icon: <Building2 className="text-darkNeutral" />,
      label: language === 'es' ? "Bancos" : "Banks",
    },
    {
      id: "entertainment",
      icon: <Film className="text-secondary" />,
      label: language === 'es' ? "Entretenimiento" : "Entertainment",
    },
    {
      id: "journey",
      icon: <Map className="text-accent" />,
      label: language === 'es' ? "Viajes" : "Journeys",
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
                }`}
                onClick={() => onTabChange(tab.id)}
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
