import { useState, useEffect, useCallback } from "react";

// Definir el tipo de idioma
type Language = "en" | "es";

// Variable global para manejar el idioma en toda la aplicación
let globalLanguage: Language = "es";

// Intentar obtener el idioma del almacenamiento local inicialmente
try {
  const stored = localStorage.getItem("language");
  if (stored === "en" || stored === "es") {
    globalLanguage = stored;
  }
} catch (e) {
  console.error("Error al leer el idioma almacenado:", e);
}

// Lista de funciones de actualización
const updateListeners: Array<(lang: Language) => void> = [];

// Función para cambiar el idioma globalmente
function setGlobalLanguage(newLang: Language) {
  globalLanguage = newLang;
  
  // Guardar en localStorage
  try {
    localStorage.setItem("language", newLang);
    document.documentElement.setAttribute("lang", newLang);
  } catch (e) {
    console.error("Error al guardar el idioma:", e);
  }
  
  // Notificar a todos los componentes
  updateListeners.forEach(listener => listener(newLang));
}

// Hook para usar el idioma
export function useLanguage() {
  // Estado local que se sincroniza con el estado global
  const [language, setLanguage] = useState<Language>(globalLanguage);
  
  // Registrar listener para actualizaciones
  useEffect(() => {
    const updateLanguage = (newLang: Language) => {
      setLanguage(newLang);
    };
    
    updateListeners.push(updateLanguage);
    
    // Limpiar al desmontar
    return () => {
      const index = updateListeners.indexOf(updateLanguage);
      if (index > -1) {
        updateListeners.splice(index, 1);
      }
    };
  }, []);
  
  // Función para alternar el idioma
  const toggleLanguage = useCallback(() => {
    const newLang = globalLanguage === "en" ? "es" : "en";
    console.log("Cambiando idioma a:", newLang);
    setGlobalLanguage(newLang);
  }, []);
  
  return { language, toggleLanguage };
}
