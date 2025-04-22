import { useState, useEffect, useCallback } from "react";

type Language = "en" | "es";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage first
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage) return savedLanguage;
    
    // Otherwise, determine the language from browser
    const browserLanguage = navigator.language.split("-")[0].toLowerCase();
    return browserLanguage === "es" ? "es" : "en";
  });
  
  useEffect(() => {
    localStorage.setItem("language", language);
    // Optionally set the lang attribute on the html element
    document.documentElement.lang = language;
  }, [language]);
  
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === "en" ? "es" : "en");
  }, []);
  
  return { language, toggleLanguage };
}
