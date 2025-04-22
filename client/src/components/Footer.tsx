import { useLanguage } from "@/hooks/useLanguage";
import { MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  const { language } = useLanguage();

  const texts = {
    tagline: language === 'es' 
      ? "Información local a tu alcance" 
      : "Local information at your fingertips",
    rights: language === 'es'
      ? "© 2023 LocaInfo. Todos los derechos reservados."
      : "© 2023 LocaInfo. All rights reserved.",
    privacy: language === 'es' ? "Privacidad" : "Privacy",
    terms: language === 'es' ? "Términos" : "Terms",
    contact: language === 'es' ? "Contacto" : "Contact"
  };

  return (
    <footer className="bg-darkNeutral text-white mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <MapPin className="text-primary mr-2" />
              <h2 className="text-xl font-bold">LocaInfo</h2>
            </div>
            <p className="text-sm text-gray-400 mt-1">{texts.tagline}</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-primary transition">
              <Facebook size={20} />
            </a>
            <a href="#" className="hover:text-primary transition">
              <Twitter size={20} />
            </a>
            <a href="#" className="hover:text-primary transition">
              <Instagram size={20} />
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-4 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-2 md:mb-0">{texts.rights}</p>
            <div className="flex space-x-4 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition">{texts.privacy}</a>
              <a href="#" className="text-gray-400 hover:text-white transition">{texts.terms}</a>
              <a href="#" className="text-gray-400 hover:text-white transition">{texts.contact}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
