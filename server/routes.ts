import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import cors from "cors";
import NodeCache from "node-cache";
import axios from "axios";
import { log, serveStatic } from "./vite";

// ESM no tiene __dirname, así que creamos nuestra propia versión
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache para almacenar datos temporalmente y reducir llamadas API
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hora de caché por defecto

// Función para obtener URLs de imágenes reales por categoría
function getImageByCategory(category: string, index: number = 0): string {
  // Variedad de imágenes por categoría
  const imageLibrary = {
    restaurant: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop"
    ],
    bank: [
      "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526304760382-3591d3840148?w=800&auto=format&fit=crop"
    ],
    recreation: [
      "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523761057508-c9fce6814194?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603201277993-bfd45a7a4031?w=800&auto=format&fit=crop"
    ],
    entertainment: [
      "https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?w=800&auto=format&fit=crop"
    ],
    event: [
      "https://images.unsplash.com/photo-1538333702852-c1b7a2a93001?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=800&auto=format&fit=crop"
    ]
  };

  // Obtener array de imágenes para la categoría solicitada
  const images = imageLibrary[category as keyof typeof imageLibrary] || [];
  
  // Si no hay imágenes disponibles, devolver una imagen de respaldo
  if (images.length === 0) {
    return `https://via.placeholder.com/800x600?text=${encodeURIComponent(category)}`;
  }
  
  // Devolver una imagen según el índice (con wrap-around)
  return images[index % images.length];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuración CORS
  app.use(cors());
  
  // Middleware para parsear JSON
  app.use(express.json());
  
  // Servir archivos estáticos desde public
  app.use(express.static(path.join(__dirname, "../public")));
  
  // API Keys (en producción, estas deberían estar en variables de entorno)
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
  const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || "";
  
  // LOCATION ENDPOINTS
  app.get("/api/location/suggestions", (req, res) => {
    // Sugerencias de ubicaciones para el autocompletado
    const suggestions = [
      { zipCode: "33026", city: "Test City, FL" },
      { zipCode: "90210", city: "Beverly Hills, CA" },
      { zipCode: "10001", city: "New York, NY" },
      { zipCode: "60601", city: "Chicago, IL" },
      { zipCode: "75001", city: "Dallas, TX" },
    ];
    
    res.json(suggestions);
  });
  
  app.get("/api/location/:zipCode", (req, res) => {
    const { zipCode } = req.params;
    
    // Si es "suggestions", devolver sugerencias
    if (zipCode === "suggestions") {
      return res.json({ 
        zipCode: "suggestions", 
        city: "Test City", 
        state: "FL",
        latitude: 26.1224,
        longitude: -80.3432
      });
    }
    
    // Check cache first
    const cacheKey = `location_${zipCode}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Para simplificar, devolvemos datos simulados
    const locationData = {
      zipCode,
      city: "Test City",
      state: "FL",
      latitude: 26.1224,
      longitude: -80.3432
    };
    
    // Save to cache
    cache.set(cacheKey, locationData);
    
    res.json(locationData);
  });
  
  app.get("/api/location/coordinates", (req, res) => {
    const { lat, lng } = req.query;
    
    // Aquí normalmente haríamos una llamada a un servicio de geocodificación inversa
    // para obtener el código postal basado en las coordenadas
    
    // Por ahora, simplemente devolvemos un código postal ficticio
    res.json({
      zipCode: "33026",
      city: "Test City",
      state: "FL",
      latitude: lat,
      longitude: lng
    });
  });
  
  // WEATHER ENDPOINTS
  app.get("/api/weather/current/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `current_weather_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get latitude and longitude
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have an OpenWeather API key, use mockup data for testing
      if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "") {
        console.log("Using mockup data: No OpenWeather API key available for current weather");
        
        // Create mockup current weather
        const mockWeather = {
          temp: 26,
          feelsLike: 24,
          description: "Cielo despejado",
          condition: "clear",
          windSpeed: 5.2,
          humidity: 65,
          visibility: 10,
          date: new Date().toISOString()
        };
        
        // Save to cache
        cache.set(cacheKey, mockWeather);
        
        return res.json(mockWeather);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      
      const weatherData = {
        temp: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        description: response.data.weather[0].description,
        condition: response.data.weather[0].main.toLowerCase(),
        windSpeed: response.data.wind.speed,
        humidity: response.data.main.humidity,
        visibility: response.data.visibility / 1000,
        date: new Date().toISOString()
      };
      
      // Save to cache
      cache.set(cacheKey, weatherData);
      
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching current weather:", error);
      res.status(500).json({ message: "Failed to fetch current weather" });
    }
  });
  
  app.get("/api/weather/forecast/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `forecast_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get latitude and longitude
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have an OpenWeather API key, use mockup data for testing
      if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === "") {
        console.log("Using mockup data: No OpenWeather API key available for forecast");
        
        // Get day names
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = new Date().getDay();
        
        // Create mockup forecast for 5 days
        const mockForecast = {
          days: Array.from({ length: 5 }, (_, index) => {
            const dayIndex = (today + index) % 7;
            return {
              name: days[dayIndex],
              highTemp: Math.round(25 + Math.random() * 5),
              lowTemp: Math.round(15 + Math.random() * 5),
              condition: ["clear", "clouds", "rain", "clear", "clouds"][index]
            };
          })
        };
        
        // Save to cache
        cache.set(cacheKey, mockForecast);
        
        return res.json(mockForecast);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      
      // Get daily forecasts
      const forecasts = response.data.list;
      const dailyForecasts: { [key: string]: any } = {};
      
      // Group by day and get min/max temps
      forecasts.forEach((forecast: any) => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (!dailyForecasts[day]) {
          dailyForecasts[day] = {
            highTemp: forecast.main.temp_max,
            lowTemp: forecast.main.temp_min,
            condition: forecast.weather[0].main.toLowerCase()
          };
        } else {
          if (forecast.main.temp_max > dailyForecasts[day].highTemp) {
            dailyForecasts[day].highTemp = forecast.main.temp_max;
          }
          if (forecast.main.temp_min < dailyForecasts[day].lowTemp) {
            dailyForecasts[day].lowTemp = forecast.main.temp_min;
          }
        }
      });
      
      // Convert to array and limit to 5 days
      const forecastDays = Object.keys(dailyForecasts).slice(0, 5).map(name => ({
        name,
        highTemp: Math.round(dailyForecasts[name].highTemp),
        lowTemp: Math.round(dailyForecasts[name].lowTemp),
        condition: dailyForecasts[name].condition
      }));
      
      const weatherData = {
        days: forecastDays
      };
      
      // Save to cache
      cache.set(cacheKey, weatherData);
      
      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather forecast:", error);
      res.status(500).json({ message: "Failed to fetch weather forecast" });
    }
  });
  
  // EVENTS ENDPOINTS
  app.get("/api/events/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `events_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get latitude and longitude
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { city, state } = locationRes.data;
      
      // If we don't have a Ticketmaster API key, use mockup data for testing
      if (!TICKETMASTER_API_KEY || TICKETMASTER_API_KEY === "") {
        console.log("Using mockup data: No Ticketmaster API key available for events");
        
        // Create mockup events
        const mockEvents = [
          {
            id: "evt1",
            name: "Community Music Festival",
            description: "Un increíble festival con artistas locales e internacionales. ¡No te lo pierdas!",
            location: "Parque Central, Test City",
            day: "15",
            month: "May",
            time: "5:00 PM",
            categories: ["Music", "Festival", "Outdoor"],
            imageUrl: "/images/categories/events.svg"
          },
          {
            id: "evt2",
            name: "Exposición de Arte Moderno",
            description: "Descubre las últimas tendencias en arte contemporáneo con artistas emergentes.",
            location: "Galería de Arte Municipal, Test City",
            day: "22",
            month: "May",
            time: "10:00 AM",
            categories: ["Art", "Exhibition", "Indoor"],
            imageUrl: "/images/categories/events.svg"
          },
          {
            id: "evt3",
            name: "Maratón Benéfico",
            description: "Participa en esta carrera para recaudar fondos para causas locales. Todas las edades son bienvenidas.",
            location: "Centro Deportivo, Test City",
            day: "29",
            month: "May",
            time: "8:00 AM",
            categories: ["Sports", "Charity", "Outdoor"],
            imageUrl: "/images/categories/events.svg"
          },
          {
            id: "evt4",
            name: "Feria Gastronómica",
            description: "Prueba la mejor comida local e internacional en este evento culinario que reúne a los mejores chefs de la región.",
            location: "Plaza Central, Test City",
            day: "05",
            month: "Jun",
            time: "12:00 PM",
            categories: ["Food", "Fair", "Outdoor"],
            imageUrl: "/images/categories/events.svg"
          }
        ];
        
        // Save to cache
        cache.set(cacheKey, mockEvents);
        
        return res.json(mockEvents);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&city=${city}&stateCode=${state}&size=10`
      );
      
      if (!response.data._embedded || !response.data._embedded.events) {
        return res.json([]);
      }
      
      // Process events data
      const events = response.data._embedded.events.map((event: any) => {
        // Get the date parts
        const eventDate = new Date(event.dates.start.dateTime);
        const day = eventDate.getDate().toString();
        const month = eventDate.toLocaleString('en-US', { month: 'short' });
        let time = "TBA";
        
        if (event.dates.start.localTime) {
          time = new Date(`2000-01-01T${event.dates.start.localTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Get categories
        const categories = [];
        if (event.classifications && event.classifications.length > 0) {
          const classification = event.classifications[0];
          if (classification.segment) categories.push(classification.segment.name);
          if (classification.genre) categories.push(classification.genre.name);
          if (classification.subGenre) categories.push(classification.subGenre.name);
        }
        
        return {
          id: event.id,
          name: event.name,
          description: event.info || event.pleaseNote || "No additional information available.",
          location: event._embedded?.venues?.[0]?.name || "TBA",
          day,
          month,
          time,
          categories: categories.filter(Boolean),
          imageUrl: event.images?.[0]?.url || "https://via.placeholder.com/400x300?text=Event"
        };
      });
      
      // Save to cache
      cache.set(cacheKey, events);
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // RECREATION PLACES ENDPOINTS
  app.get("/api/recreation/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `recreation_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get latitude and longitude
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have a Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available for recreation places");
        
        // Create mockup recreation places
        const mockPlaces = [
          {
            id: "rec1",
            name: "Central Park",
            description: "Un hermoso parque con senderos para caminar, áreas de picnic y juegos infantiles.",
            address: "123 Park Ave, Test City, FL",
            imageUrl: getImageByCategory("recreation", 0),
            rating: 4.7,
            tags: ["Park", "Nature", "Family Friendly"],
            hours: "6:00 AM - 10:00 PM",
            latitude: latitude + 0.01,
            longitude: longitude - 0.01
          },
          {
            id: "rec2",
            name: "Community Swimming Pool",
            description: "Una piscina pública ideal para refrescarse durante los días calurosos.",
            address: "456 Water St, Test City, FL",
            imageUrl: getImageByCategory("recreation", 1),
            rating: 4.2,
            tags: ["Swimming", "Sports", "Family Friendly"],
            hours: "8:00 AM - 8:00 PM",
            latitude: latitude - 0.01,
            longitude: longitude + 0.02
          },
          {
            id: "rec3",
            name: "Hiking Trail",
            description: "Senderos naturales con vistas panorámicas, perfecto para los amantes del senderismo.",
            address: "789 Mountain Rd, Test City, FL",
            imageUrl: getImageByCategory("recreation", 2),
            rating: 4.8,
            tags: ["Hiking", "Nature", "Adventure"],
            hours: "Sunrise to Sunset",
            latitude: latitude + 0.02,
            longitude: longitude + 0.01
          },
          {
            id: "rec4",
            name: "Tennis Courts",
            description: "Canchas de tenis públicas disponibles para reserva o por orden de llegada.",
            address: "101 Sports Blvd, Test City, FL",
            imageUrl: getImageByCategory("recreation", 3),
            rating: 4.0,
            tags: ["Tennis", "Sports", "Active"],
            hours: "7:00 AM - 9:00 PM",
            latitude: latitude - 0.02,
            longitude: longitude - 0.01
          }
        ];
        
        // Save to cache
        cache.set(cacheKey, mockPlaces);
        
        return res.json(mockPlaces);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=park|gym|swimming_pool|stadium|campground&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json([]);
      }
      
      // Process recreation data
      const places = response.data.results.slice(0, 5).map((place: any, index: number) => {
        // Determine tags based on place types
        const tags = [];
        
        if (place.types.includes("park")) tags.push("Park");
        if (place.types.includes("gym")) tags.push("Fitness");
        if (place.types.includes("swimming_pool")) tags.push("Swimming");
        if (place.types.includes("stadium")) tags.push("Sports");
        if (place.types.includes("campground")) tags.push("Camping");
        
        // Add general tags
        if (index % 2 === 0) tags.push("Family Friendly");
        if (index % 3 === 0) tags.push("Nature");
        
        return {
          id: place.place_id,
          name: place.name,
          description: `A popular ${tags[0] ? tags[0].toLowerCase() : "recreation"} spot in the area.`,
          address: place.vicinity,
          imageUrl: place.photos && place.photos[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : "https://via.placeholder.com/400x300?text=Recreation",
          rating: place.rating || 4.0,
          tags,
          hours: place.opening_hours?.open_now
            ? "Currently Open"
            : "Hours may vary",
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        };
      });
      
      // Save to cache
      cache.set(cacheKey, places);
      
      res.json(places);
    } catch (error) {
      console.error("Error fetching recreation places:", error);
      res.status(500).json({ message: "Failed to fetch recreation places" });
    }
  });
  
  // BANKS ENDPOINTS
  app.get("/api/banks/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `banks_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first to get latitude and longitude
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have a Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available for banks");
        
        // Create mockup banks
        const mockBanks = [
          {
            id: "bank1",
            name: "First National Bank",
            address: "100 Main St, Test City, FL",
            hours: "9:00 - 17:00",
            isOpen: new Date().getHours() >= 9 && new Date().getHours() < 17,
            services: ["ATM", "Customer Service", "Loans"],
            distance: "0.5",
            latitude: latitude + 0.005,
            longitude: longitude + 0.005,
            imageUrl: getImageByCategory("bank", 0)
          },
          {
            id: "bank2",
            name: "Community Credit Union",
            address: "200 Market St, Test City, FL",
            hours: "9:00 - 17:00",
            isOpen: new Date().getHours() >= 9 && new Date().getHours() < 17,
            services: ["ATM", "Investments"],
            distance: "1.2",
            latitude: latitude - 0.007,
            longitude: longitude - 0.003,
            imageUrl: getImageByCategory("bank", 1)
          },
          {
            id: "bank3",
            name: "City Bank & Trust",
            address: "300 Finance Blvd, Test City, FL",
            hours: "8:30 - 16:30",
            isOpen: new Date().getHours() >= 8.5 && new Date().getHours() < 16.5,
            services: ["Customer Service", "Loans", "Investments"],
            distance: "1.8",
            latitude: latitude - 0.01,
            longitude: longitude + 0.008,
            imageUrl: getImageByCategory("bank", 2)
          },
          {
            id: "bank4",
            name: "International Banking Group",
            address: "400 Global Ave, Test City, FL",
            hours: "9:00 - 18:00",
            isOpen: new Date().getHours() >= 9 && new Date().getHours() < 18,
            services: ["ATM", "Foreign Currency"],
            distance: "2.3",
            latitude: latitude + 0.012,
            longitude: longitude - 0.009,
            imageUrl: getImageByCategory("bank", 3)
          }
        ];
        
        // Save to cache
        cache.set(cacheKey, mockBanks);
        
        return res.json(mockBanks);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=bank&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json([]);
      }
      
      // Process bank data
      const banks = response.data.results.slice(0, 5).map((bank: any, index: number) => {
        // Determine if the bank is open (in a real app, would use actual hours)
        const isOpen = new Date().getHours() >= 9 && new Date().getHours() < 17;
        
        // Determine services
        const services = [];
        if (index % 3 === 0 || index % 2 === 0) services.push("ATM");
        if (index % 2 === 0) services.push("Customer Service");
        if (index % 3 === 1) services.push("Loans");
        if (index % 3 === 2) services.push("Investments");
        
        return {
          id: bank.place_id,
          name: bank.name,
          address: bank.vicinity,
          hours: "9:00 - 17:00",
          isOpen,
          services,
          distance: ((index + 1) * 0.6).toFixed(1),
          latitude: bank.geometry.location.lat,
          longitude: bank.geometry.location.lng,
          imageUrl: bank.photos && bank.photos[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${bank.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : `https://via.placeholder.com/400x300?text=${encodeURIComponent(bank.name)}`
        };
      });
      
      // Save to cache
      cache.set(cacheKey, banks);
      
      res.json(banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });
  
  // ENTERTAINMENT ENDPOINTS
  app.get("/api/entertainment/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `entertainment_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available for entertainment");
        
        // Create mockup featured entertainment
        const mockFeatured = {
          id: "ent1",
          name: "Fiesta Theater & Entertainment",
          location: "123 Cinema Drive, Test City, FL",
          description: "Experience one of the best entertainment options in your area with dining, movies, and games all in one place!",
          imageUrl: getImageByCategory("entertainment", 0),
          categories: ["Movie Theater", "Restaurant"]
        };
        
        // Create mockup entertainment options
        const mockOptions = [
          {
            id: "ent2",
            name: "Gourmet Experience Restaurant",
            location: "456 Food Blvd, Test City, FL",
            imageUrl: getImageByCategory("restaurant", 5),
            rating: 4.8,
            reviewCount: 120,
            category: "Restaurant"
          },
          {
            id: "ent3",
            name: "City Art Gallery",
            location: "789 Culture St, Test City, FL",
            imageUrl: getImageByCategory("entertainment", 1),
            rating: 4.5,
            reviewCount: 85,
            category: "Art"
          },
          {
            id: "ent4",
            name: "Downtown Bowling Center",
            location: "234 Fun Ave, Test City, FL",
            imageUrl: getImageByCategory("entertainment", 2),
            rating: 4.3,
            reviewCount: 95,
            category: "Bowling"
          },
          {
            id: "ent5",
            name: "Rhythm Night Club",
            location: "567 Music Lane, Test City, FL",
            imageUrl: getImageByCategory("entertainment", 3),
            rating: 4.6,
            reviewCount: 150,
            category: "Night Life"
          }
        ];
        
        const mockEntertainmentData = {
          featured: mockFeatured,
          options: mockOptions
        };
        
        // Save to cache
        cache.set(cacheKey, mockEntertainmentData);
        
        return res.json(mockEntertainmentData);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant|movie_theater|bowling_alley|night_club|art_gallery&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json(null);
      }
      
      // Process entertainment data
      const places = response.data.results;
      
      // Select a featured place (first result)
      const featured = {
        id: places[0].place_id,
        name: places[0].name,
        location: places[0].vicinity,
        description: "Experience one of the best entertainment options in your area!",
        imageUrl: places[0].photos && places[0].photos[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${places[0].photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
          : "https://via.placeholder.com/400x300?text=No+Image",
        categories: places[0].types
          .filter((type: string) => !["establishment", "point_of_interest"].includes(type))
          .map((type: string) => type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "))
          .slice(0, 2)
      };
      
      // Process other entertainment options
      const options = places.slice(1, 5).map((place: any) => {
        let category = "Entertainment";
        
        if (place.types.includes("restaurant")) category = "Restaurant";
        else if (place.types.includes("movie_theater")) category = "Cinema";
        else if (place.types.includes("night_club")) category = "Night Life";
        else if (place.types.includes("art_gallery")) category = "Art";
        else if (place.types.includes("bowling_alley")) category = "Bowling";
        
        return {
          id: place.place_id,
          name: place.name,
          location: place.vicinity,
          imageUrl: place.photos && place.photos[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : "https://via.placeholder.com/400x300?text=No+Image",
          rating: place.rating || 4.0,
          reviewCount: place.user_ratings_total || 50,
          category
        };
      });
      
      const entertainmentData = {
        featured,
        options
      };
      
      // Save to cache
      cache.set(cacheKey, entertainmentData);
      
      res.json(entertainmentData);
    } catch (error) {
      console.error("Error fetching entertainment:", error);
      res.status(500).json({ message: "Failed to fetch entertainment options" });
    }
  });
  
  // RESTAURANTS ENDPOINTS
  app.get("/api/restaurants/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `restaurants_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data first
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // If we don't have Google Places API key, use mockup data for testing
      if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === "") {
        console.log("Using mockup data: No Google Places API key available for restaurants");
        
        // Create mockup restaurants
        const mockRestaurants = [
          {
            id: "rest1",
            name: "El Rincón Mexicano",
            description: "Auténtica cocina mexicana con un ambiente acogedor y cálido servicio.",
            address: "123 Taco Street, Test City, FL",
            imageUrl: getImageByCategory("restaurant", 0),
            rating: 4.7,
            priceLevel: 2,
            cuisine: ["mexican", "latin"],
            hours: "11:00 AM - 10:00 PM",
            phoneNumber: "(555) 123-4567",
            features: ["Outdoor Seating", "Full Bar", "Takeout"],
            latitude: latitude + 0.01,
            longitude: longitude - 0.01
          },
          {
            id: "rest2",
            name: "Pasta Paradise",
            description: "Restaurante italiano familiar con las mejores pastas caseras de la ciudad.",
            address: "456 Pasta Avenue, Test City, FL",
            imageUrl: getImageByCategory("restaurant", 1),
            rating: 4.5,
            priceLevel: 3,
            cuisine: ["italian", "european"],
            hours: "12:00 PM - 10:00 PM",
            phoneNumber: "(555) 987-6543",
            features: ["Family Friendly", "Wine Selection", "Reservations"],
            latitude: latitude - 0.01,
            longitude: longitude + 0.01
          },
          {
            id: "rest3",
            name: "Burger Bistro",
            description: "Las hamburguesas gourmet más jugosas con ingredientes frescos y locales.",
            address: "789 Burger Boulevard, Test City, FL",
            imageUrl: getImageByCategory("restaurant", 2),
            rating: 4.6,
            priceLevel: 2,
            cuisine: ["american", "burgers"],
            hours: "11:00 AM - 11:00 PM",
            phoneNumber: "(555) 456-7890",
            features: ["Craft Beer", "Vegetarian Options", "Delivery"],
            latitude: latitude + 0.02,
            longitude: longitude + 0.02
          },
          {
            id: "rest4",
            name: "Sushi Sensation",
            description: "Exquisito sushi y platos japoneses preparados por chefs expertos.",
            address: "321 Sushi Street, Test City, FL",
            imageUrl: getImageByCategory("restaurant", 3),
            rating: 4.8,
            priceLevel: 4,
            cuisine: ["japanese", "asian", "sushi"],
            hours: "12:00 PM - 10:30 PM",
            phoneNumber: "(555) 321-0987",
            features: ["Chef's Table", "Sake Bar", "Catering"],
            latitude: latitude - 0.02,
            longitude: longitude - 0.01
          },
          {
            id: "rest5",
            name: "Healthy Bites Café",
            description: "Opciones saludables, orgánicas y deliciosas para todos los gustos.",
            address: "555 Green Street, Test City, FL",
            imageUrl: getImageByCategory("restaurant", 4),
            rating: 4.4,
            priceLevel: 2,
            cuisine: ["healthy", "vegetarian", "vegan"],
            hours: "7:00 AM - 8:00 PM",
            phoneNumber: "(555) 555-5555",
            features: ["Gluten-Free", "Plant-Based", "Smoothies"],
            latitude: latitude,
            longitude: longitude - 0.015
          }
        ];
        
        // Save to cache
        cache.set(cacheKey, mockRestaurants);
        
        return res.json(mockRestaurants);
      }
      
      // If we have an API key, fetch real data
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.data.results || response.data.results.length === 0) {
        return res.json([]);
      }
      
      // Process restaurants data
      const places = response.data.results;
      
      // Get details for each restaurant for more information
      const restaurantsDetailsPromises = places.slice(0, 5).map(async (place: any) => {
        try {
          const detailsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,opening_hours,price_level&key=${GOOGLE_PLACES_API_KEY}`
          );
          
          const details = detailsResponse.data.result || {};
          
          // Determine cuisine based on place types
          const cuisineTypes: string[] = [];
          if (place.types.includes("restaurant")) {
            if (place.types.includes("mexican_restaurant")) cuisineTypes.push("mexican");
            else if (place.types.includes("italian_restaurant")) cuisineTypes.push("italian");
            else if (place.types.includes("japanese_restaurant")) cuisineTypes.push("japanese");
            else if (place.types.includes("chinese_restaurant")) cuisineTypes.push("chinese");
            else if (place.types.includes("indian_restaurant")) cuisineTypes.push("indian");
            else cuisineTypes.push("international");
          }
          
          // Determine features
          const features = [];
          if (details.opening_hours?.open_now) features.push("Open Now");
          if (place.types.includes("meal_takeaway")) features.push("Takeout");
          if (place.types.includes("meal_delivery")) features.push("Delivery");
          if (place.types.includes("bar")) features.push("Bar");
          
          return {
            id: place.place_id,
            name: place.name,
            description: place.vicinity,
            address: place.vicinity,
            imageUrl: place.photos && place.photos[0]
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
              : "https://via.placeholder.com/400x300?text=No+Image",
            rating: place.rating || 4.0,
            priceLevel: details.price_level || Math.floor(Math.random() * 3) + 1,
            cuisine: cuisineTypes.length > 0 ? cuisineTypes : ["restaurant"],
            hours: details.opening_hours?.weekday_text?.[0] || "Call for hours",
            phoneNumber: details.formatted_phone_number || "Not available",
            features: features.length > 0 ? features : ["Family Friendly"],
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          };
        } catch (error) {
          console.error("Error fetching restaurant details:", error);
          return null;
        }
      });
      
      // Wait for all details requests and filter out nulls
      const restaurantsWithDetails = (await Promise.all(restaurantsDetailsPromises)).filter(Boolean);
      
      // Save to cache
      cache.set(cacheKey, restaurantsWithDetails);
      
      res.json(restaurantsWithDetails);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  // JOURNEYS ENDPOINT (Nueva característica)
  app.get("/api/journeys/:zipCode", async (req, res) => {
    try {
      const { zipCode } = req.params;
      
      // Check cache first
      const cacheKey = `journeys_${zipCode}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Get location data
      const locationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/location/${zipCode}`);
      const { latitude, longitude } = locationRes.data;
      
      // Para simplificar, siempre usamos datos de ejemplo para los viajes
      // Este endpoint podría integrarse con APIs reales para obtener rutas recomendadas
      
      // Obtener datos de lugares cercanos para cada tipo
      const recreationRes = await axios.get(`http://localhost:${req.socket.localPort}/api/recreation/${zipCode}`);
      const entertainmentRes = await axios.get(`http://localhost:${req.socket.localPort}/api/entertainment/${zipCode}`);
      const eventsRes = await axios.get(`http://localhost:${req.socket.localPort}/api/events/${zipCode}`);
      const restaurantsRes = await axios.get(`http://localhost:${req.socket.localPort}/api/restaurants/${zipCode}`);
      const banksRes = await axios.get(`http://localhost:${req.socket.localPort}/api/banks/${zipCode}`);
      
      // Crear viajes de ejemplo usando los datos reales
      const createJourneyLocations = () => {
        const locations = [];
        
        // Agregar un lugar de recreación si está disponible
        if (recreationRes.data && recreationRes.data.length > 0) {
          const recreationPlace = recreationRes.data[0];
          locations.push({
            id: recreationPlace.id,
            name: recreationPlace.name,
            description: recreationPlace.description,
            imageUrl: recreationPlace.imageUrl,
            latitude: recreationPlace.latitude,
            longitude: recreationPlace.longitude,
            type: "recreation",
            story: "Comienza tu día con aire fresco y actividades al aire libre en este fantástico lugar.",
            duration: 90
          });
        }
        
        // Agregar un lugar de entretenimiento si está disponible
        if (entertainmentRes.data && entertainmentRes.data.featured) {
          const entertainmentPlace = entertainmentRes.data.featured;
          locations.push({
            id: entertainmentPlace.id,
            name: entertainmentPlace.name,
            description: entertainmentPlace.description,
            imageUrl: entertainmentPlace.imageUrl,
            latitude: latitude + 0.01,  // Aproximación
            longitude: longitude - 0.01, // Aproximación
            type: "entertainment",
            story: "Continúa tu aventura con entretenimiento de primera clase. ¡Este lugar tiene algo para todos!",
            duration: 120
          });
        }
        
        // Agregar un evento si está disponible
        if (eventsRes.data && eventsRes.data.length > 0) {
          const event = eventsRes.data[0];
          locations.push({
            id: event.id,
            name: event.name,
            description: event.description,
            imageUrl: event.imageUrl,
            latitude: latitude - 0.01,  // Aproximación
            longitude: longitude + 0.01, // Aproximación
            type: "event",
            story: "Participa en este evento especial que está sucediendo cerca. Una experiencia única.",
            duration: 180
          });
        }
        
        // Agregar un restaurante si está disponible
        if (restaurantsRes.data && restaurantsRes.data.length > 0) {
          const restaurant = restaurantsRes.data[0];
          locations.push({
            id: restaurant.id,
            name: restaurant.name,
            description: restaurant.description,
            imageUrl: restaurant.imageUrl,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            type: "restaurant",
            story: "Disfruta de una deliciosa comida en este fantástico restaurante, el lugar perfecto para recargar energías.",
            duration: 90
          });
        }
        
        // Asegurarse de que haya al menos 3 ubicaciones
        if (locations.length < 3 && banksRes.data && banksRes.data.length > 0) {
          const bank = banksRes.data[0];
          locations.push({
            id: bank.id,
            name: bank.name,
            description: "Un lugar conveniente para manejar tus finanzas.",
            imageUrl: bank.imageUrl,
            latitude: bank.latitude,
            longitude: bank.longitude,
            type: "bank",
            story: "Una parada rápida para gestionar tus finanzas antes de continuar con tu aventura.",
            duration: 30
          });
        }
        
        return locations;
      };
      
      const journeys = [
        {
          id: "journey1",
          name: "Día Perfecto en la Ciudad",
          description: "Un recorrido por los mejores lugares para visitar en un día",
          locations: createJourneyLocations(),
          totalDuration: 420 // 7 horas en total
        },
        {
          id: "journey2",
          name: "Aventura al Aire Libre",
          description: "Explora la naturaleza y actividades exteriores",
          locations: [
            // Versión simplificada del segundo viaje
            {
              id: "loc5",
              name: "Sendero Natural",
              description: "Ruta escénica con vistas panorámicas",
              imageUrl: "/images/categories/recreation.svg",
              latitude: latitude + 0.015,
              longitude: longitude - 0.015,
              type: "recreation",
              story: "Inicia tu aventura en este espectacular sendero. La fresca brisa matutina te dará energía para todo el día.",
              duration: 120
            },
            {
              id: "loc6",
              name: "Lago para Kayak",
              description: "Actividades acuáticas para toda la familia",
              imageUrl: "/images/categories/recreation.svg",
              latitude: latitude + 0.02,
              longitude: longitude - 0.02,
              type: "recreation",
              story: "Después de caminar, es hora de refrescarse. Remar por el lago te dará una perspectiva única de la belleza natural.",
              duration: 90
            },
            {
              id: "loc7",
              name: "Mirador de Aves",
              description: "Observa especies exóticas en su hábitat natural",
              imageUrl: "/images/categories/entertainment.svg",
              latitude: latitude + 0.025,
              longitude: longitude - 0.025,
              type: "entertainment",
              story: "Tómate un momento para apreciar la vida silvestre. Este mirador es famoso por sus increíbles vistas de aves.",
              duration: 60
            },
            {
              id: "loc8",
              name: "Restaurante Rústico",
              description: "Cocina local con ingredientes frescos",
              imageUrl: "/images/categories/restaurants.svg",
              latitude: latitude + 0.03,
              longitude: longitude - 0.01,
              type: "restaurant",
              story: "Termina tu aventura con una deliciosa comida en este acogedor restaurante con vistas panorámicas al bosque.",
              duration: 90
            }
          ],
          totalDuration: 360 // 6 horas en total
        }
      ];
      
      // Save to cache
      cache.set(cacheKey, journeys);
      
      res.json(journeys);
    } catch (error) {
      console.error("Error fetching journeys:", error);
      res.status(500).json({ message: "Failed to fetch journey options" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}