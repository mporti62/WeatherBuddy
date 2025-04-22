import { useState, useEffect, useCallback } from "react";

type Language = "en" | "es";

// Vamos a simplificar para facilitar la solución
export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      // Try to get language from localStorage first
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage === "en" || savedLanguage === "es") return savedLanguage;
      
      // Default to Spanish
      return "es";
    } catch (error) {
      // Fallback to Spanish if any error occurs
      return "es";
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem("language", language);
      // Set the lang attribute on the html element
      document.documentElement.lang = language;
      console.log("LANGUAGE CHANGED TO:", language);
    } catch (error) {
      console.error("Error setting language:", error);
    }
  }, [language]);
  
  const toggleLanguage = useCallback(() => {
    console.log("TOGGLING LANGUAGE FROM:", language);
    setLanguage(prev => {
      const newLang = prev === "en" ? "es" : "en";
      console.log("NEW LANGUAGE:", newLang);
      return newLang;
    });
  }, [language]);
  
  return { language, toggleLanguage };
}
