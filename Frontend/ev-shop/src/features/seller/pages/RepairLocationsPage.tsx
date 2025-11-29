import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { sellerService } from "../sellerService";
import type { AlertProps } from "@/types";
import { Loader } from "@/components/Loader";
import {
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from "@/assets/icons/icons";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const createCustomIcon = (color: string = "red") => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

interface RepairLocation {
  _id: string;
  seller_id: string;
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

// Component to handle map clicks
function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * A page for sellers to manage their repair locations on a map.
 */
export const RepairLocationsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const { getActiveRoleId } = useAuth();
  const sellerId = getActiveRoleId();
  const [locations, setLocations] = useState<RepairLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<RepairLocation | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: 7.8731, // Default to Sri Lanka center
    longitude: 80.7718,
    phone: "",
    email: "",
    operating_hours: "",
    description: "",
    is_active: true,
  });

  // Fetch repair locations
  useEffect(() => {
    if (sellerId) {
      fetchLocations();
    }
  }, [sellerId]);

  const fetchLocations = async () => {
    if (!sellerId) return;
    try {
      setIsLoading(true);
      const response = await sellerService.getRepairLocations(sellerId);
      const locationsData = response?.locations || response || [];
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (error: any) {
      console.error("Failed to fetch repair locations:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to load repair locations",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!showAddForm && !editingLocation) return;

    setFormData({
      ...formData,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    });
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address) return;

    try {
      // Use OpenStreetMap Nominatim API for geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address + ", Sri Lanka"
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Location found on map!",
          type: "success",
        });
      } else {
        setAlert?.({
          id: Date.now(),
          title: "Warning",
          message:
            "Could not find location. Please click on the map to set coordinates.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message:
          "Failed to geocode address. Please click on the map to set coordinates.",
        type: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      latitude: 7.8731,
      longitude: 80.7718,
      phone: "",
      email: "",
      operating_hours: "",
      description: "",
      is_active: true,
    });
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId) return;

    if (
      !formData.name ||
      !formData.address ||
      !formData.latitude ||
      !formData.longitude
    ) {
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Please fill in all required fields and set location on map",
        type: "error",
      });
      return;
    }

    try {
      setIsSaving(true);
      if (editingLocation) {
        await sellerService.updateRepairLocation(editingLocation._id, {
          ...formData,
          seller_id: sellerId,
        });
        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Repair location updated successfully!",
          type: "success",
        });
      } else {
        await sellerService.createRepairLocation({
          ...formData,
          seller_id: sellerId,
        });
        setAlert?.({
          id: Date.now(),
          title: "Success",
          message: "Repair location added successfully!",
          type: "success",
        });
      }
      resetForm();
      fetchLocations();
    } catch (error: any) {
      console.error("Failed to save repair location:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to save repair location";
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (location: RepairLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      phone: location.phone || "",
      email: location.email || "",
      operating_hours: location.operating_hours || "",
      description: location.description || "",
      is_active: location.is_active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this repair location?")
    ) {
      return;
    }

    try {
      await sellerService.deleteRepairLocation(id);
      setAlert?.({
        id: Date.now(),
        title: "Success",
        message: "Repair location deleted successfully!",
        type: "success",
      });
      fetchLocations();
    } catch (error: any) {
      console.error("Failed to delete repair location:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to delete repair location",
        type: "error",
      });
    }
  };

  // Calculate center of all locations for map view
  const getMapCenter = () => {
    if (locations.length === 0) {
      return [7.8731, 80.7718] as [number, number]; // Default to Sri Lanka center
    }
    const avgLat =
      locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
    const avgLng =
      locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
    return [avgLat, avgLng] as [number, number];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Repair Locations</h1>
        {!showAddForm && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add Location
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            {editingLocation
              ? "Edit Repair Location"
              : "Add New Repair Location"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Main Service Center"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                    placeholder="e.g., 123 Main St, Colombo"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    title="Find location on map"
                  >
                    <MapPinIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  placeholder="e.g., 7.8731"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  placeholder="e.g., 80.7718"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="e.g., +94 11 234 5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="e.g., service@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={formData.operating_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operating_hours: e.target.value,
                    })
                  }
                  placeholder="e.g., Mon-Fri: 9AM-6PM"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Active Status
                </label>
                <select
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.value === "true",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Describe services offered at this location..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>

            {/* Map for selecting location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Click on map to set location coordinates *
              </label>
              <div className="w-full h-64 border-2 border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
                <MapContainer
                  center={[formData.latitude, formData.longitude]}
                  zoom={10}
                  style={{ height: "100%", width: "100%", zIndex: 0 }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {formData.latitude && formData.longitude && (
                    <Marker
                      position={[formData.latitude, formData.longitude]}
                      icon={createCustomIcon("red")}
                    />
                  )}
                  <MapClickHandler onClick={handleMapClick} />
                </MapContainer>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Click on the map or use the address geocoding button to set
                coordinates
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? "Saving..."
                  : editingLocation
                  ? "Update Location"
                  : "Add Location"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-200 text-gray-800 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List with Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map View */}
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 dark:text-white">Map View</h2>
          <div className="w-full h-96 border-2 border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
            {locations.length > 0 ? (
              <MapContainer
                center={getMapCenter()}
                zoom={locations.length === 1 ? 12 : 8}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.map((location) => (
                  <Marker
                    key={location._id}
                    position={[location.latitude, location.longitude]}
                    icon={createCustomIcon(
                      location.is_active ? "blue" : "gray"
                    )}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-sm">{location.name}</h3>
                        <p className="text-xs text-gray-600">
                          {location.address}
                        </p>
                        {location.phone && (
                          <p className="text-xs text-gray-600">
                            Phone: {location.phone}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No locations to display. Add a location to see it on the map.
                </p>
              </div>
            )}
          </div>
          {locations.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Showing {locations.length} location
              {locations.length !== 1 ? "s" : ""} on map
            </p>
          )}
        </div>

        {/* Locations List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold dark:text-white">Your Locations</h2>
          {locations.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
              <p className="text-gray-500 text-center py-10 dark:text-gray-400">
                No repair locations added yet. Click "Add Location" to get
                started.
              </p>
            </div>
          ) : (
            locations.map((location) => (
              <div
                key={location._id}
                className="bg-white p-4 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {location.name}
                    </h3>
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
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          location.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {location.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Edit location"
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(location._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
                      title="Delete location"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairLocationsPage;
