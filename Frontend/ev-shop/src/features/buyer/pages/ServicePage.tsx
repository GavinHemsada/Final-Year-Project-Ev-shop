import React, { useState, useEffect } from "react";
import type { Service, AlertProps } from "@/types";
import { buyerService } from "../buyerService";
import { Loader } from "@/components/Loader";
import { useToast } from "@/context/ToastContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from "@/assets/icons/icons";

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const services: Service[] = [
  {
    name: "Standard Maintenance",
    desc: "Comprehensive check-up and battery health report.",
  },
  { name: "Tire Service", desc: "Rotation, alignment, and replacement." },
  {
    name: "Software Update",
    desc: "Get the latest features and performance improvements.",
  },
];

interface RepairLocation {
  _id: string;
  seller_id: {
    _id: string;
    business_name: string;
    shop_logo?: string;
  };
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  operating_hours?: string;
  description?: string;
  is_active: boolean;
}

// Custom marker icon for repair shops
const repairShopIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const apiURL = import.meta.env.VITE_API_URL;

/**
 * A page component that displays a list of available services and repair shop locations.
 */
const Services: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  const { showToast } = useToast();
  const [repairLocations, setRepairLocations] = useState<RepairLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    fetchRepairLocations();
  }, []);

  const fetchRepairLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const response = await buyerService.getAllRepairLocations();
      // handleResult unwraps the response, so response is directly the locations array
      let locationsData: RepairLocation[] = [];

      if (Array.isArray(response)) {
        locationsData = response;
      } else if (response && Array.isArray(response.locations)) {
        locationsData = response.locations;
      }

      setRepairLocations(locationsData);
    } catch (error: any) {
      console.error("Failed to fetch repair locations:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to load repair locations";
      showToast({
        text: errorMessage,
        type: "error",
      });
      setRepairLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Calculate map center based on locations or default to Sri Lanka center
  const defaultCenter: L.LatLngExpression = [7.8731, 80.7718]; // Center of Sri Lanka
  const mapCenter: L.LatLngExpression =
    repairLocations.length > 0
      ? [
          repairLocations.reduce((sum, loc) => sum + loc.latitude, 0) /
            repairLocations.length,
          repairLocations.reduce((sum, loc) => sum + loc.longitude, 0) /
            repairLocations.length,
        ]
      : defaultCenter;

  return (
    <div className="space-y-6">
      {/* Services Section */}
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Our Services</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="border border-gray-200 p-6 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-300 dark:border-gray-700 dark:hover:border-blue-600 dark:bg-gray-900"
            >
              <h3 className="text-xl font-semibold dark:text-white">
                {service.name}
              </h3>
              <p className="text-gray-600 mt-2 dark:text-gray-300">
                {service.desc}
              </p>
              <button className="mt-4 text-blue-600 font-semibold hover:underline dark:text-blue-400">
                Learn More
              </button>
            </div>
          ))}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg md:col-span-2 hover:shadow-lg transition-shadow duration-300 dark:bg-blue-900/20 dark:border-blue-700">
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
              Charging Station Locator
            </h3>
            <p className="text-blue-700 mt-2 dark:text-blue-300">
              Find charging stations near you or along your route. Our network is
              always growing.
            </p>
            <button className="mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 dark:bg-blue-700 dark:hover:bg-blue-600">
              Find a Charger
            </button>
          </div>
        </div>
      </div>

      {/* Repair Shop Locations Section */}
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h2 className="text-3xl font-bold mb-6 dark:text-white">
          Repair Shop Locations
        </h2>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          Find authorized repair shops near you. All locations are verified and active.
        </p>

        {isLoadingLocations ? (
          <div className="flex justify-center items-center py-20">
            <Loader size={60} color="#4f46e5" />
          </div>
        ) : repairLocations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">
              No repair shop locations available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map View */}
            <div className="w-full h-96 border-2 border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
              <MapContainer
                center={mapCenter}
                zoom={repairLocations.length > 1 ? 8 : 10}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {repairLocations.map((location) => (
                  <Marker
                    key={location._id}
                    position={[location.latitude, location.longitude]}
                    icon={repairShopIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <strong className="text-lg">{location.name}</strong>
                        <br />
                        <span className="text-sm text-gray-600">
                          {location.seller_id?.business_name || "Repair Shop"}
                        </span>
                        <br />
                        <span className="text-sm">{location.address}</span>
                        {location.phone && (
                          <>
                            <br />
                            <span className="text-sm">📞 {location.phone}</span>
                          </>
                        )}
                        {location.operating_hours && (
                          <>
                            <br />
                            <span className="text-sm">🕒 {location.operating_hours}</span>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Locations List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {repairLocations.map((location) => (
                <div
                  key={location._id}
                  className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-start gap-3">
                    {location.seller_id?.shop_logo ? (
                      <img
                        src={`${apiURL}${location.seller_id.shop_logo}`}
                        alt={location.seller_id.business_name}
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                        {location.seller_id?.business_name?.charAt(0).toUpperCase() || "R"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {location.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {location.seller_id?.business_name || "Repair Shop"}
                      </p>
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{location.address}</span>
                      </div>
                      {location.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{location.phone}</span>
                        </div>
                      )}
                      {location.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <EnvelopeIcon className="h-4 w-4" />
                          <span>{location.email}</span>
                        </div>
                      )}
                      {location.operating_hours && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{location.operating_hours}</span>
                        </div>
                      )}
                      {location.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {location.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
