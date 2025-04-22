import { useState, useCallback } from "react";

export function useZipCode(zipCode: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const getSuggestions = useCallback(async () => {
    if (zipCode.length < 3) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/location/suggestions?zip=${zipCode}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching ZIP code suggestions:", error);
      setSuggestions([]);
    }
  }, [zipCode]);
  
  return { suggestions, getSuggestions };
}
