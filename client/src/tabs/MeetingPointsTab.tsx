import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle,
  CardContent, 
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  Plus,
  FileEdit,
  Share2,
  Tag,
  Phone,
  User,
  X,
  Save,
  UserPlus,
  Radio,
  MapPinOff,
  AlertCircle
} from "lucide-react";
import ShareButtons from "@/components/ShareButtons";
import LocationMap from "@/components/LocationMap";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLiveLocation, LiveLocation } from "@/hooks/useLiveLocation";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
// Importamos los tipos desde la interfaz en lugar del schema de la base de datos
// para evitar problemas de compatibilidad
interface MeetingPoint {
  id: number;
  name: string;
  description: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  address: string;
  date: Date | null;
  time: string | null;
  createdBy: number;
  createdAt: Date;
  status: string;
  maxParticipants: number | null;
  category: string;
  contactInfo: string;
}

interface MeetingPointsTabProps {
  zipCode: string;
}

// Mock data para desarrollo
const getMockMeetingPoints = (zipCode: string): MeetingPoint[] => {
  return [
    {
      id: 1,
      name: "Club de lectura en el parque",
      description: "Reunión semanal para discutir libros y compartir opiniones en un ambiente relajado.",
      zipCode: zipCode,
      latitude: 26.1524,
      longitude: -80.3132,
      address: "Parque Central, Calle Principal",
      date: new Date("2023-12-15T14:00:00"),
      time: "14:00",
      createdBy: 1,
      createdAt: new Date(),
      status: "active",
      maxParticipants: 15,
      category: "cultural",
      contactInfo: "juan@ejemplo.com"
    },
    {
      id: 2,
      name: "Grupo de running matutino",
      description: "Salida grupal para correr 5km a un ritmo moderado. Todos los niveles bienvenidos.",
      zipCode: zipCode,
      latitude: 26.1624,
      longitude: -80.3232,
      address: "Pista de atletismo municipal",
      date: new Date("2023-12-10T07:30:00"),
      time: "07:30",
      createdBy: 2,
      createdAt: new Date(),
      status: "active",
      maxParticipants: 20,
      category: "deporte",
      contactInfo: "clubrunning@ejemplo.com"
    },
    {
      id: 3,
      name: "Intercambio de idiomas",
      description: "Practica inglés, español y francés con hablantes nativos en un ambiente informal.",
      zipCode: zipCode,
      latitude: 26.1724,
      longitude: -80.3332,
      address: "Café La Esquina, Av. Central 123",
      date: new Date("2023-12-18T18:00:00"),
      time: "18:00",
      createdBy: 3,
      createdAt: new Date(),
      status: "active",
      maxParticipants: 12,
      category: "educativo",
      contactInfo: "idiomas@ejemplo.com"
    }
  ];
};

// Validación del formulario
const meetingPointFormSchema = z.object({
  name: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres."
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres."
  }),
  address: z.string().min(5, {
    message: "La dirección debe tener al menos 5 caracteres."
  }),
  date: z.string().optional(),
  time: z.string().optional(),
  maxParticipants: z.string().transform(val => parseInt(val) || undefined).optional(),
  category: z.string(),
  contactInfo: z.string().min(5, {
    message: "La información de contacto debe tener al menos 5 caracteres."
  }),
});

type MeetingPointFormValues = {
  name: string;
  description: string;
  address: string;
  date?: string;
  time?: string;
  maxParticipants?: string;
  category: string;
  contactInfo: string;
};

export default function MeetingPointsTab({ zipCode }: MeetingPointsTabProps) {
  const { language } = useLanguage();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MeetingPoint | null>(null);
  const [activeView, setActiveView] = useState<"list" | "map">("list");
  const [category, setCategory] = useState<string>("all");
  const [userName, setUserName] = useState<string>("Usuario" + Math.floor(Math.random() * 1000));
  const [sharingLocation, setSharingLocation] = useState<boolean>(false);
  
  // Hook para la funcionalidad de ubicación en tiempo real
  const { 
    locations: liveLocations, 
    isSharing, 
    error: liveLocationError, 
    shareLocation,
    stopSharingLocation
  } = useLiveLocation(selectedPoint?.id || null, `user-${Math.floor(Math.random() * 10000)}`);

  // React Hook Form para la creación de puntos de encuentro
  const form = useForm<MeetingPointFormValues>({
    resolver: zodResolver(meetingPointFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      date: "",
      time: "",
      maxParticipants: "",
      category: "social",
      contactInfo: "",
    }
  });

  // Obtener puntos de encuentro
  const { data: meetingPoints, isLoading } = useQuery<MeetingPoint[]>({
    queryKey: [`/api/meeting-points/${zipCode}`],
    enabled: zipCode.length === 5,
    initialData: [], // Para desarrollo
  });

  // Efecto para cargar datos mock durante desarrollo
  useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      // Simular la carga de datos desde la API
      const mockData = getMockMeetingPoints(zipCode);
      queryClient.setQueryData([`/api/meeting-points/${zipCode}`], mockData);
    }
  }, [zipCode]);

  // Traducciones
  const translations = {
    meetingPoints: language === 'es' ? "Puntos de Encuentro" : "Meeting Points",
    create: language === 'es' ? "Crear Punto de Encuentro" : "Create Meeting Point",
    list: language === 'es' ? "Lista" : "List",
    map: language === 'es' ? "Mapa" : "Map",
    filterByCategory: language === 'es' ? "Filtrar por categoría" : "Filter by category",
    all: language === 'es' ? "Todos" : "All",
    social: language === 'es' ? "Social" : "Social",
    deporte: language === 'es' ? "Deporte" : "Sports",
    cultural: language === 'es' ? "Cultural" : "Cultural",
    educativo: language === 'es' ? "Educativo" : "Educational",
    otros: language === 'es' ? "Otros" : "Others",
    name: language === 'es' ? "Nombre" : "Name",
    description: language === 'es' ? "Descripción" : "Description",
    address: language === 'es' ? "Dirección" : "Address",
    date: language === 'es' ? "Fecha" : "Date",
    time: language === 'es' ? "Hora" : "Time",
    maxParticipants: language === 'es' ? "Número máximo de participantes" : "Maximum number of participants",
    category: language === 'es' ? "Categoría" : "Category",
    contactInfo: language === 'es' ? "Información de contacto" : "Contact information",
    save: language === 'es' ? "Guardar" : "Save",
    cancel: language === 'es' ? "Cancelar" : "Cancel",
    meetingPointDetails: language === 'es' ? "Detalles del punto de encuentro" : "Meeting point details",
    share: language === 'es' ? "Compartir" : "Share",
    join: language === 'es' ? "Unirse" : "Join",
    edit: language === 'es' ? "Editar" : "Edit",
    delete: language === 'es' ? "Eliminar" : "Delete",
    createMeetingPoint: language === 'es' ? "Crear un nuevo punto de encuentro" : "Create a new meeting point",
    required: language === 'es' ? "Requerido" : "Required",
    optional: language === 'es' ? "Opcional" : "Optional",
    participants: language === 'es' ? "Participantes" : "Participants",
    organizer: language === 'es' ? "Organizador" : "Organizer",
    comingSoon: language === 'es' ? "Próximamente" : "Coming soon",
    noMeetingPoints: language === 'es' ? "No hay puntos de encuentro en esta zona. ¡Crea uno!" : "No meeting points in this area. Create one!",
    // Traducciones para la ubicación en tiempo real
    shareLocation: language === 'es' ? "Compartir mi ubicación" : "Share my location",
    stopSharing: language === 'es' ? "Dejar de compartir" : "Stop sharing",
    liveLocation: language === 'es' ? "Ubicación en tiempo real" : "Live location",
    userName: language === 'es' ? "Tu nombre" : "Your name",
    locationSharing: language === 'es' ? "Compartiendo ubicación..." : "Sharing location...",
    locationError: language === 'es' ? "Error al compartir ubicación" : "Error sharing location", 
    otherParticipants: language === 'es' ? "Otros participantes" : "Other participants",
    noParticipants: language === 'es' ? "No hay otros participantes compartiendo su ubicación" : "No other participants sharing their location",
    youAreHere: language === 'es' ? "Estás aquí" : "You are here",
    liveLocations: language === 'es' ? "Ubicaciones en tiempo real" : "Live locations",
    enableLocation: language === 'es' ? "Habilita tu ubicación para unirte" : "Enable your location to join",
  };

  // Filtrar por categoría
  const filteredMeetingPoints = meetingPoints?.filter(point => 
    category === 'all' || point.category === category
  );

  // Manejar la creación de un nuevo punto de encuentro
  const handleCreateMeetingPoint = async (values: MeetingPointFormValues) => {
    try {
      // En una implementación real, esto sería una llamada API
      // await apiRequest('/api/meeting-points', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     ...values,
      //     zipCode,
      //     latitude: 26.1824, // En una implementación real, se obtendría de un mapa o geocodificación
      //     longitude: -80.3432,
      //   })
      // });

      // Para desarrollo, simulamos la creación
      const newPoint: MeetingPoint = {
        id: Math.floor(Math.random() * 1000),
        name: values.name,
        description: values.description,
        zipCode: zipCode,
        latitude: 26.1824,
        longitude: -80.3432,
        address: values.address,
        date: values.date ? new Date(values.date) : null,
        time: values.time || null,
        createdBy: 1, // Usuario actual
        createdAt: new Date(),
        status: "active",
        maxParticipants: values.maxParticipants ? Number(values.maxParticipants) : null,
        category: values.category,
        contactInfo: values.contactInfo,
      };

      const currentPoints = queryClient.getQueryData<MeetingPoint[]>([`/api/meeting-points/${zipCode}`]) || [];
      queryClient.setQueryData([`/api/meeting-points/${zipCode}`], [...currentPoints, newPoint]);

      // Cerrar el diálogo y limpiar el formulario
      setOpenCreateDialog(false);
      form.reset();
      
    } catch (error) {
      console.error("Error al crear el punto de encuentro:", error);
    }
  };

  // Componente para el formulario de creación
  const CreateMeetingPointForm = () => (
    <form onSubmit={form.handleSubmit(handleCreateMeetingPoint)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-medium text-blue-300">
          {translations.name} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...form.register("name")}
          className="bg-[#252525] border-[#444] text-white hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="font-medium text-blue-300">
          {translations.description} <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          {...form.register("description")}
          className="bg-[#252525] border-[#444] text-white hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="font-medium text-blue-300">
          {translations.address} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="address"
          {...form.register("address")}
          className="bg-[#252525] border-[#444] text-white hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {form.formState.errors.address && (
          <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-purple-300 font-medium">
            {translations.date} <span className="text-gray-400 text-xs">({translations.optional})</span>
          </Label>
          <Input
            id="date"
            type="date"
            {...form.register("date")}
            className="bg-[#252525] border-[#444] text-white hover:border-purple-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="text-yellow-300 font-medium">
            {translations.time} <span className="text-gray-400 text-xs">({translations.optional})</span>
          </Label>
          <Input
            id="time"
            type="time"
            {...form.register("time")}
            className="bg-[#252525] border-[#444] text-white hover:border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">
            {translations.category} <span className="text-red-500">*</span>
          </Label>
          <Select 
            onValueChange={(value) => form.setValue("category", value)} 
            defaultValue={form.getValues("category")}
          >
            <SelectTrigger className="bg-[#252525] border-[#444] text-white hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <SelectValue placeholder={translations.category} />
            </SelectTrigger>
            <SelectContent className="bg-[#252525] border-[#444] text-white">
              <SelectItem value="social" className="focus:bg-blue-900 focus:bg-opacity-20 focus:text-blue-300">{translations.social}</SelectItem>
              <SelectItem value="deporte" className="focus:bg-green-900 focus:bg-opacity-20 focus:text-green-300">{translations.deporte}</SelectItem>
              <SelectItem value="cultural" className="focus:bg-purple-900 focus:bg-opacity-20 focus:text-purple-300">{translations.cultural}</SelectItem>
              <SelectItem value="educativo" className="focus:bg-yellow-900 focus:bg-opacity-20 focus:text-yellow-300">{translations.educativo}</SelectItem>
              <SelectItem value="otros" className="focus:bg-gray-900 focus:bg-opacity-20 focus:text-gray-300">{translations.otros}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxParticipants" className="text-green-300 font-medium">
            {translations.maxParticipants} <span className="text-gray-400 text-xs">({translations.optional})</span>
          </Label>
          <Input
            id="maxParticipants"
            type="number"
            {...form.register("maxParticipants")}
            className="bg-[#252525] border-[#444] text-white hover:border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo" className="text-indigo-300 font-medium">
          {translations.contactInfo} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="contactInfo"
          {...form.register("contactInfo")}
          className="bg-[#252525] border-[#444] text-white hover:border-indigo-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Email, teléfono o redes sociales"
        />
        {form.formState.errors.contactInfo && (
          <p className="text-sm text-red-500">{form.formState.errors.contactInfo.message}</p>
        )}
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => setOpenCreateDialog(false)}
          className="border-[#444] text-gray-300 hover:text-white hover:bg-[#333] hover:shadow-md transition-all duration-200"
        >
          <X className="h-4 w-4 mr-1.5" />
          {translations.cancel}
        </Button>
        <Button 
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {translations.save}
        </Button>
      </DialogFooter>
    </form>
  );

  // Formato para la fecha
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  // Función para manejar el cambio en compartir ubicación
  const handleLocationSharingToggle = () => {
    if (isSharing) {
      stopSharingLocation();
    } else {
      if (selectedPoint) {
        shareLocation(userName);
      }
    }
  };
  
  // Componente para los detalles del punto de encuentro
  const MeetingPointDetails = ({ point }: { point: MeetingPoint }) => {
    // Lugares para mostrar en el mapa (incluyendo ubicaciones en tiempo real)
    const mapPlaces = [
      // El punto de encuentro principal
      {
        latitude: point.latitude,
        longitude: point.longitude,
        name: point.name,
        description: point.description || "",
        imageUrl: ""
      },
      // Ubicaciones en tiempo real de otros participantes
      ...liveLocations.filter(loc => loc.userId !== `user-${Math.floor(Math.random() * 10000)}`).map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: loc.userName,
        description: `${translations.otherParticipants}`,
        imageUrl: loc.userAvatar || ""
      }))
    ];
    
    return (
      <div className="space-y-4">
        <div className="relative h-60 overflow-hidden rounded-t-lg">
          {/* Mapa con ubicaciones en tiempo real */}
          <div className="h-full">
            <LocationMap 
              location={{
                latitude: point.latitude,
                longitude: point.longitude,
                name: point.name
              }}
              places={mapPlaces}
              zoom={15}
              className="h-full w-full rounded-none"
            />
          </div>
          <div className="absolute top-2 right-2">
            <ShareButtons 
              url={window.location.href} 
              title={point.name} 
              description={point.description || ""}
              hashtags={["meetingPoint", point.category || ""]}
              small={true}
              showText={false}
              location={{
                latitude: point.latitude,
                longitude: point.longitude,
                name: point.name
              }}
              liveLocations={liveLocations}
            />
          </div>
        </div>
        
        <div className="px-6 py-4">
          <h3 className="text-xl font-bold mb-2 text-white">{point.name}</h3>
          <p className="text-gray-300 mb-4">{point.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-blue-400 mr-2" />
              <span className="text-gray-300">{point.address}</span>
            </div>
            
            {point.date && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-400 mr-2" />
                <span className="text-gray-300">{formatDate(new Date(point.date))}</span>
              </div>
            )}
            
            {point.time && (
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-gray-300">{point.time}</span>
              </div>
            )}
            
            {point.maxParticipants && (
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-gray-300">{point.maxParticipants} {translations.participants}</span>
              </div>
            )}
            
            {point.category && (
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-red-400 mr-2" />
                <span className="bg-red-900 bg-opacity-20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-800 text-sm">{
                  point.category === 'social' ? translations.social :
                  point.category === 'deporte' ? translations.deporte :
                  point.category === 'cultural' ? translations.cultural :
                  point.category === 'educativo' ? translations.educativo :
                  translations.otros
                }</span>
              </div>
            )}
            
            {point.contactInfo && (
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-indigo-400 mr-2" />
                <span className="text-gray-300">{point.contactInfo}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <User className="h-5 w-5 text-orange-400 mr-2" />
              <span className="text-gray-300">{translations.organizer} #{point.createdBy}</span>
            </div>
          </div>
          
          {/* Sección para compartir ubicación en tiempo real */}
          <div className="mt-6 mb-6 space-y-4 border border-[#333] rounded-lg p-4 bg-[#1a1a1a]">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-blue-400 flex items-center">
                <Radio className="h-5 w-5 mr-2" />
                {translations.liveLocation}
              </h4>
              
              {isSharing && (
                <Badge className="bg-green-600 text-white animate-pulse">
                  {translations.locationSharing}
                </Badge>
              )}
            </div>
            
            {liveLocationError && (
              <Alert variant="destructive" className="bg-red-900 bg-opacity-20 border border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {translations.locationError}: {liveLocationError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="userName" className="text-gray-300">
                  {translations.userName}
                </Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-[#252525] border-[#444] text-white max-w-[300px]"
                  disabled={isSharing}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="location-sharing"
                  checked={isSharing}
                  onCheckedChange={handleLocationSharingToggle}
                  className="data-[state=checked]:bg-green-600"
                />
                <Label htmlFor="location-sharing" className="text-gray-300">
                  {isSharing ? translations.stopSharing : translations.shareLocation}
                </Label>
              </div>
              
              {/* Lista de participantes que comparten ubicación */}
              {liveLocations.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-md font-medium text-gray-300 mb-2">
                    {translations.otherParticipants} ({liveLocations.length})
                  </h5>
                  <div className="space-y-2">
                    {liveLocations.map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between bg-[#252525] p-2 rounded-md">
                        <div className="flex items-center">
                          <Radio className="h-4 w-4 text-green-500 mr-2 animate-pulse" />
                          <span className="text-white">{loc.userName}</span>
                        </div>
                        <Badge className="bg-blue-900 bg-opacity-30 text-blue-300 border border-blue-800">
                          online
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {liveLocations.length === 0 && (
                <p className="text-gray-400 text-sm italic">
                  {translations.noParticipants}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 mt-6">
            <Button 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              {translations.join}
            </Button>
            
            <Button 
              variant="outline" 
              className="border-blue-500 text-blue-400 hover:bg-blue-900 hover:bg-opacity-20 hover:shadow-md transition-all duration-200"
            >
              <FileEdit className="h-4 w-4 mr-1.5" />
              {translations.edit}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado de la lista de puntos de encuentro
  const renderMeetingPointsList = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border border-[#333] bg-[#252525] rounded-lg overflow-hidden">
              <div className="h-32 bg-[#333]">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4 bg-[#333]" />
                <Skeleton className="h-4 w-full bg-[#333]" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-4 w-16 bg-[#333]" />
                  <Skeleton className="h-4 w-16 bg-[#333]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!filteredMeetingPoints || filteredMeetingPoints.length === 0) {
      return (
        <div className="text-center py-10">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-300">{translations.noMeetingPoints}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeetingPoints.map((point) => (
          <Card key={point.id} className="border-[#333] bg-[#252525] overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => setSelectedPoint(point)}>
            <div className="relative h-32 bg-[#1a1a1a]">
              {/* Mapa miniatura */}
              <LocationMap 
                location={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                  name: point.name
                }}
                zoom={15}
                className="h-full w-full rounded-none"
              />
              {point.category && (
                <span className="absolute top-2 left-2 bg-[#000000] bg-opacity-80 text-white border border-[#444] px-3 py-1 rounded-full text-xs shadow-md">
                  {point.category === 'social' ? translations.social :
                   point.category === 'deporte' ? translations.deporte :
                   point.category === 'cultural' ? translations.cultural :
                   point.category === 'educativo' ? translations.educativo :
                   translations.otros}
                </span>
              )}
              
              {/* Botón para compartir */}
              <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                <ShareButtons 
                  url={`${window.location.origin}${window.location.pathname}?punto=${point.id}`} 
                  title={point.name} 
                  description={point.description || ""}
                  hashtags={["meetingPoint", point.category || ""]}
                  small={true}
                  showText={false}
                  location={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                    name: point.name
                  }}
                />
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-lg mb-1 text-white truncate">{point.name}</h3>
              <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                {point.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {point.address && (
                  <div className="flex items-center text-xs text-gray-300">
                    <MapPin className="h-3 w-3 mr-1 text-blue-400" />
                    <span className="truncate max-w-[200px]">{point.address}</span>
                  </div>
                )}
                {point.date && (
                  <div className="flex items-center text-xs text-gray-300">
                    <Calendar className="h-3 w-3 mr-1 text-purple-400" />
                    <span>{formatDate(new Date(point.date))}</span>
                  </div>
                )}
                {point.time && (
                  <div className="flex items-center text-xs text-gray-300">
                    <Clock className="h-3 w-3 mr-1 text-yellow-400" />
                    <span>{point.time}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Renderizado de la vista de mapa
  const renderMapView = () => {
    if (!filteredMeetingPoints || filteredMeetingPoints.length === 0) {
      return (
        <div className="text-center py-10">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-300">{translations.noMeetingPoints}</p>
        </div>
      );
    }

    // Obtén el primer punto para centrar el mapa (o usa una posición predeterminada)
    const centerLocation = filteredMeetingPoints[0] || { latitude: 26.1224, longitude: -80.3432 };
    
    // Crear la lista de lugares para mostrar en el mapa
    const mapPlaces = [
      // Puntos de encuentro
      ...filteredMeetingPoints.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        name: point.name,
        description: point.description || "",
        imageUrl: "" // En una implementación real, se podría añadir una imagen
      })),
      
      // Añadir ubicaciones en tiempo real si estamos viendo un punto específico
      ...(selectedPoint && liveLocations.length > 0 
        ? liveLocations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            name: loc.userName,
            description: translations.liveLocation,
            imageUrl: loc.userAvatar || ""
          }))
        : [])
    ];

    return (
      <div className="space-y-4">
        {/* Mostrar mensaje informativo si hay ubicaciones en tiempo real */}
        {selectedPoint && liveLocations.length > 0 && (
          <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-md p-3 flex items-center">
            <Radio className="h-5 w-5 text-blue-400 mr-2 animate-pulse" />
            <span className="text-blue-300">{translations.liveLocations}: {liveLocations.length}</span>
          </div>
        )}
      
        <div className="h-[500px] rounded-lg overflow-hidden">
          <LocationMap 
            location={{
              latitude: centerLocation.latitude,
              longitude: centerLocation.longitude,
              name: centerLocation.name
            }}
            places={mapPlaces}
            zoom={13}
            className="h-full w-full"
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="dark-card">
      <CardHeader className="dark-card-header flex flex-row justify-between items-center">
        <CardTitle className="text-blue-400">{translations.meetingPoints}</CardTitle>
        <div className="flex space-x-2">
          {/* Botón para crear un nuevo punto de encuentro */}
          <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-900 hover:bg-opacity-20"
              >
                <Plus className="h-4 w-4 mr-1" />
                {translations.create}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e1e] border border-[#333] text-white max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-blue-400">
                  {translations.createMeetingPoint}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {language === 'es' ? 
                    "Completa el formulario para crear un nuevo punto de encuentro." : 
                    "Fill out the form to create a new meeting point."}
                </DialogDescription>
              </DialogHeader>
              <CreateMeetingPointForm />
            </DialogContent>
          </Dialog>
          
          {/* Selector de vista (lista/mapa) */}
          <Tabs defaultValue="list" className="hidden md:block">
            <TabsList className="bg-[#252525]">
              <TabsTrigger 
                value="list" 
                onClick={() => setActiveView("list")}
                className="data-[state=active]:bg-blue-900 data-[state=active]:bg-opacity-20 data-[state=active]:text-blue-400"
              >
                {translations.list}
              </TabsTrigger>
              <TabsTrigger 
                value="map" 
                onClick={() => setActiveView("map")}
                className="data-[state=active]:bg-blue-900 data-[state=active]:bg-opacity-20 data-[state=active]:text-blue-400"
              >
                {translations.map}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Para móviles, botones simples */}
          <div className="flex space-x-1 md:hidden">
            <Button 
              variant={activeView === "list" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveView("list")}
              className={`text-sm ${activeView === "list" ? "bg-blue-900 bg-opacity-30 text-blue-400" : "border-[#444] text-gray-300"}`}
            >
              {translations.list}
            </Button>
            <Button 
              variant={activeView === "map" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveView("map")}
              className={`text-sm ${activeView === "map" ? "bg-blue-900 bg-opacity-30 text-blue-400" : "border-[#444] text-gray-300"}`}
            >
              {translations.map}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Filtro por categoría */}
        <div className="mb-6">
          <Label htmlFor="category-filter" className="text-gray-300 mb-2 block">
            {translations.filterByCategory}
          </Label>
          <Select onValueChange={setCategory} defaultValue={category}>
            <SelectTrigger 
              id="category-filter" 
              className="bg-[#252525] border-[#444] text-white w-full md:w-1/3"
            >
              <SelectValue placeholder={translations.filterByCategory} />
            </SelectTrigger>
            <SelectContent className="bg-[#252525] border-[#444] text-white">
              <SelectItem value="all">{translations.all}</SelectItem>
              <SelectItem value="social">{translations.social}</SelectItem>
              <SelectItem value="deporte">{translations.deporte}</SelectItem>
              <SelectItem value="cultural">{translations.cultural}</SelectItem>
              <SelectItem value="educativo">{translations.educativo}</SelectItem>
              <SelectItem value="otros">{translations.otros}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Contenido principal */}
        {activeView === "list" ? renderMeetingPointsList() : renderMapView()}
        
        {/* Diálogo para mostrar detalles del punto de encuentro */}
        <Dialog open={!!selectedPoint} onOpenChange={(open) => !open && setSelectedPoint(null)}>
          <DialogContent className="bg-[#1e1e1e] border border-[#333] text-white p-0 max-w-4xl">
            {selectedPoint && <MeetingPointDetails point={selectedPoint} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}