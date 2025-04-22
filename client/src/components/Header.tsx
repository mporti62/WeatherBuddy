import { useState } from "react";
import SearchBar from "./SearchBar";
import CategoryTabs from "./CategoryTabs";
import { useLanguage } from "@/hooks/useLanguage";

interface HeaderProps {
  onSearch: (zipCode: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasValidZipCode?: boolean; // Indica si hay un código postal válido
}

export default function Header({ onSearch, activeTab, onTabChange, hasValidZipCode = false }: HeaderProps) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-50 dark-header">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-3 md:mb-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h1 className="text-xl font-bold gradient-text">LocaInfo</h1>
            <div className="ml-auto md:hidden">
              <button 
                className="px-2 py-1 text-sm border border-blue-500 text-blue-400 rounded"
                onClick={toggleLanguage}
              >
                {language === 'es' ? 'EN' : 'ES'}
              </button>
            </div>
          </div>
          
          <SearchBar onSearch={onSearch} />
          
          <div className="hidden md:block">
            <button 
              className="px-3 py-1 border border-blue-500 text-blue-400 rounded hover:bg-blue-900 hover:bg-opacity-30 transition-colors"
              onClick={toggleLanguage}
            >
              {language === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </div>
      
      <CategoryTabs activeTab={activeTab} onTabChange={onTabChange} hasValidZipCode={hasValidZipCode} />
    </header>
  );
}
