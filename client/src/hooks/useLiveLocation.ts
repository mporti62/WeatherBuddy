import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

type LocationUpdateData = {
  id: number;
  userId: string;
  userName: string;
  meetingPointId: number;
  latitude: number;
  longitude: number;
  status: string;
  lastUpdated: string;
  userAvatar?: string;
  device?: string;
};

type WebSocketMessage = {
  type: string;
  data: LocationUpdateData[];
};

export interface LiveLocation {
  id: number;
  userId: string;
  userName: string;
  meetingPointId: number;
  latitude: number;
  longitude: number;
  status: string;
  lastUpdated: string;
  userAvatar?: string;
  device?: string;
}

export const useLiveLocation = (meetingPointId: number | null, userId?: string) => {
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (!meetingPointId) return;

    try {
      // Crear la URL del WebSocket con el protocolo correcto
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?meetingPointId=${meetingPointId}`;
      
      // Cerrar la conexión existente si hay alguna
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      
      // Crear una nueva conexión WebSocket
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Conexión WebSocket establecida');
        // Cargar ubicaciones iniciales desde el servidor
        fetchLocations();
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          if (message.type === 'locationUpdates') {
            setLocations(message.data);
          }
        } catch (error) {
          console.error('Error al procesar mensaje WebSocket:', error);
          setError('Error al recibir actualizaciones de ubicación');
        }
      };
      
      ws.onerror = (error) => {
        console.error('Error en conexión WebSocket:', error);
        setError('Error en la conexión de ubicación en tiempo real');
      };
      
      ws.onclose = () => {
        console.log('Conexión WebSocket cerrada');
      };
      
      wsRef.current = ws;
      
      // Limpiar la conexión al desmontar
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Error al configurar WebSocket:', error);
      setError('No se pudo conectar al servicio de ubicación en tiempo real');
    }
  }, [meetingPointId]);

  // Función para cargar ubicaciones desde el servidor REST
  const fetchLocations = useCallback(async () => {
    if (!meetingPointId) return;
    
    try {
      const response = await axios.get(`/api/live-location/${meetingPointId}`);
      setLocations(response.data);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      setError('Error al cargar ubicaciones en tiempo real');
    }
  }, [meetingPointId]);

  // Compartir la ubicación actual del usuario
  const shareLocation = useCallback(async (userName: string, userAvatar?: string) => {
    if (!meetingPointId || !userId) return;
    
    try {
      setIsSharing(true);
      
      // Función para obtener y enviar la ubicación actual
      const updateLocation = async () => {
        try {
          const position = await getCurrentPosition();
          
          // Enviar la ubicación al servidor
          await axios.post('/api/live-location', {
            userId,
            userName,
            meetingPointId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            userAvatar,
            device: navigator.userAgent
          });
        } catch (error) {
          console.error('Error al actualizar ubicación:', error);
          setError('Error al compartir tu ubicación');
          setIsSharing(false);
        }
      };
      
      // Actualizar la ubicación inmediatamente y luego cada 10 segundos
      updateLocation();
      const intervalId = setInterval(updateLocation, 10000);
      
      // Limpiar al desmontar
      return () => {
        clearInterval(intervalId);
        stopSharingLocation();
      };
    } catch (error) {
      console.error('Error al iniciar compartir ubicación:', error);
      setError('No se pudo iniciar el servicio de compartir ubicación');
      setIsSharing(false);
    }
  }, [meetingPointId, userId]);

  // Dejar de compartir la ubicación
  const stopSharingLocation = useCallback(async () => {
    if (!meetingPointId || !userId) return;
    
    try {
      // Marcar la ubicación como inactiva en el servidor
      await axios.delete(`/api/live-location/${userId}/${meetingPointId}`);
      setIsSharing(false);
    } catch (error) {
      console.error('Error al detener compartir ubicación:', error);
      setError('Error al detener el servicio de compartir ubicación');
    }
  }, [meetingPointId, userId]);

  // Obtener la posición actual del usuario
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        reject(new Error('Geolocalización no disponible en este dispositivo'));
      }
    });
  };

  // Conectar al WebSocket cuando cambie el ID del punto de encuentro
  useEffect(() => {
    const cleanup = connectWebSocket();
    
    return () => {
      if (cleanup) cleanup();
      
      // Asegurarse de que cualquier ubicación compartida se desactive al desmontar
      if (isSharing && userId && meetingPointId) {
        axios.delete(`/api/live-location/${userId}/${meetingPointId}`).catch(console.error);
      }
    };
  }, [connectWebSocket, isSharing, userId, meetingPointId]);

  return {
    locations,
    isSharing,
    error,
    shareLocation,
    stopSharingLocation
  };
};