import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Search } from "lucide-react";
import { useZipCode } from "@/hooks/useZipCode";

interface SearchBarProps {
  onSearch: (zipCode: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const { language } = useLanguage();
  const [zipCode, setZipCode] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { getSuggestions, suggestions } = useZipCode(zipCode);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholderText = language === 'es' 
    ? "Ingresa tu código postal" 
    : "Enter your ZIP code";

  useEffect(() => {
    if (zipCode.length >= 3) {
      getSuggestions();
    }
  }, [zipCode, getSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode && zipCode.length >= 5) {
      onSearch(zipCode);
      setShowSuggestions(false);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d*$/.test(value)) {
      setZipCode(value);
      setShowSuggestions(value.length >= 3);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setZipCode(suggestion.split(' - ')[0]);
    setShowSuggestions(false);
    onSearch(suggestion.split(' - ')[0]);
  };

  return (
    <div className="w-full md:w-auto">
      <form onSubmit={handleSubmit} className="flex">
        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            type="text"
            value={zipCode}
            onChange={handleZipCodeChange}
            onFocus={() => zipCode.length >= 3 && setShowSuggestions(true)}
            placeholder={placeholderText}
            className="dark-input w-full px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={5}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute w-full bg-[#2d2d2d] border-l border-r border-b border-[#444] rounded-b-lg shadow-lg z-10"
            >
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="px-4 py-2 hover:bg-[#3d3d3d] text-gray-200 cursor-pointer"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button 
          type="submit" 
          className="dark-button px-4 py-2 rounded-r-lg focus:outline-none"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
