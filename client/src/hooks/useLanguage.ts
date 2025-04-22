import { useState, useEffect, useCallback } from "react";

// Definir el tipo de idioma
type Language = "en" | "es";

// Simplificamos el hook para evitar problemas con contextos
export function useLanguage() {
  // Obtener el idioma almacenado o usar español como predeterminado
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem("language");
      return (stored === "en" || stored === "es") ? stored as Language : "es";
    } catch (e) {
      return "es";
    }
  });

  // Forza la actualización de la página al cambiar idioma
  const forceUpdate = useCallback(() => {
    // Este es un pequeño truco para forzar la actualización de toda la aplicación
    window.location.reload();
  }, []);

  // Actualizar el almacenamiento local cuando cambia el idioma
  useEffect(() => {
    try {
      localStorage.setItem("language", language);
      document.documentElement.setAttribute("lang", language);
      console.log("Idioma actualizado a:", language);
    } catch (e) {
      console.error("Error al guardar idioma:", e);
    }
  }, [language]);

  // Función para alternar entre idiomas
  const toggleLanguage = useCallback(() => {
    console.log("Cambiando idioma desde:", language);
    setLanguage(prevLang => {
      const newLang = prevLang === "en" ? "es" : "en";
      localStorage.setItem("language", newLang);
      
      // Forzar actualización después de cambiar el idioma
      setTimeout(forceUpdate, 100);
      
      return newLang;
    });
  }, [language, forceUpdate]);

  return { language, toggleLanguage };
}
