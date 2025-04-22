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
            imageUrl: "/images/event.svg"
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
            imageUrl: "/images/event.svg"
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
            imageUrl: "/images/event.svg"
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
            imageUrl: "/images/event.svg"
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
            imageUrl: "/images/recreation.svg",
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
            imageUrl: "/images/recreation.svg",
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
            imageUrl: "/images/recreation.svg",
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
            imageUrl: "/images/recreation.svg",
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
            imageUrl: "/images/bank.svg"
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
            imageUrl: "/images/bank.svg"
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
            imageUrl: "/images/bank.svg"
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
            imageUrl: "/images/bank.svg"
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
          imageUrl: "/images/entertainment.svg",
          categories: ["Movie Theater", "Restaurant"]
        };
        
        // Create mockup entertainment options
        const mockOptions = [
          {
            id: "ent2",
            name: "Gourmet Experience Restaurant",
            location: "456 Food Blvd, Test City, FL",
            imageUrl: "/images/restaurant.svg",
            rating: 4.8,
            reviewCount: 120,
            category: "Restaurant"
          },
          {
            id: "ent3",
            name: "City Art Gallery",
            location: "789 Culture St, Test City, FL",
            imageUrl: "/images/entertainment.svg",
            rating: 4.5,
            reviewCount: 85,
            category: "Art"
          },
          {
            id: "ent4",
            name: "Downtown Bowling Center",
            location: "234 Fun Ave, Test City, FL",
            imageUrl: "/images/entertainment.svg",
            rating: 4.3,
            reviewCount: 95,
            category: "Bowling"
          },
          {
            id: "ent5",
            name: "Rhythm Night Club",
            location: "567 Music Lane, Test City, FL",
            imageUrl: "/images/entertainment.svg",
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
              imageUrl: "/images/recreation.svg",
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
              imageUrl: "/images/recreation.svg",
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
              imageUrl: "/images/entertainment.svg",
              latitude: latitude + 0.025,
              longitude: longitude - 0.025,
              type: "entertainment",
              story: "Tómate un momento para apreciar la vida silvestre. Este mirador es famoso por sus increíbles vistas de aves.",
              duration: 60
            }
          ],
          totalDuration: 270 // 4.5 horas en total
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