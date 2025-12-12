import React, { useState, useEffect } from "react";
import type { Service, AlertProps, RepairLocation } from "@/types";
import { buyerService } from "../buyerService";
import { Loader } from "@/components/Loader";
import { useToast } from "@/context/ToastContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  SearchIcon,
} from "@/assets/icons/icons";

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const services: Service[] = [
  {
    name: "Standard Maintenance",
    desc: "Comprehensive check-up and battery health report.",
    detailedDesc: `Standard Maintenance is the foundation of keeping your electric vehicle in peak condition. Unlike traditional fuel-powered vehicles, EVs rely heavily on battery performance, cooling efficiency, and system diagnostics. Our comprehensive maintenance service begins with a full battery health evaluation. This includes checking battery temperature behavior, degradation levels, charge cycles, and performance trends. You receive a clear status report explaining the current condition of your battery and any preventive steps that may be needed.

                  Next, we inspect essential components such as brakes, suspension, steering, and fluid systems. Although EVs use regenerative braking, physical brake components still require routine attention. Our technicians ensure they remain responsive, safe, and long-lasting. We also check the coolant system responsible for regulating battery temperature, motor performance, and onboard electronics.

                  During the maintenance process, your vehicle undergoes a complete system scan using advanced diagnostic tools. This scan identifies any hidden issues, software errors, or early signs of component wear. Catching these issues early helps you avoid unexpected breakdowns and costly repairs.

                  The service concludes with a detailed, easy-to-understand maintenance report covering overall system health, recommended future care, and personalized feedback based on your driving habits. Whether you drive daily in city traffic or take longer trips, this maintenance service ensures your EV remains reliable, efficient, and ready for the road. Standard Maintenance is ideal for routine care, long-distance preparation, or simply keeping your vehicle performing at its best.`,
  },
  {
    name: "Tire Service",
    desc: "Rotation, alignment, and replacement.",
    detailedDesc: `Tire Service plays a major role in the safety and performance of your electric vehicle. EVs are heavier than traditional cars due to battery systems, which means tires experience more pressure and require more attentive maintenance. Our tire service ensures your vehicle maintains optimal driving stability, range, and handling.

                  The service begins with a tire wear inspection, where our team checks tread depth, surface consistency, and overall tire health. Uneven tire wear can affect your EV’s energy consumption and reduce braking performance. To fix this, we offer precise tire rotation that redistributes wear evenly across all tires.

                  Wheel alignment is another important part of the service. Proper alignment helps your vehicle steer accurately, improves handling, and prevents unnecessary strain on your tires. Misaligned wheels can also reduce battery range, so maintaining proper alignment supports both safety and efficiency.

                  If your tires are worn out or damaged, we provide high-quality replacements suitable for EV weight distribution, road grip, and noise reduction. We use equipment designed to handle electric vehicle wheels and sensors, ensuring careful installation.

                  We also check tire pressure levels, which play a big role in battery usage and road stability. Correct pressure can improve range, extend tire life, and make your ride smoother and safer.

                  Finally, you receive a full tire health report that includes current condition, recommendations, and maintenance intervals. Whether you drive daily or occasionally, our Tire Service ensures confidence on every trip, keeping your EV safe and efficient.`,
  },
  {
    name: "Software Update",
    desc: "Get the latest features and performance improvements.",
    detailedDesc: `Software Updates are one of the most important services for modern electric vehicles. EVs rely on software to manage everything from battery performance to safety systems. Regular updates ensure your vehicle stays secure, efficient, and up to date with the latest improvements.

                  Our Software Update service begins with a full diagnostic scan to check your current software version and identify pending updates. These updates may include performance enhancements, bug fixes, new features, or interface improvements. Software updates often improve charging efficiency, navigation accuracy, and energy consumption patterns. This helps your EV run more smoothly and extend its lifespan.

                  We also check system compatibility and backup important settings before installing updates. This ensures your vehicle’s preferences, saved routes, and personalized configurations remain intact after the update.

                  Security patches are a major part of software updates. These patches protect your vehicle from vulnerabilities and keep all systems safe. As EVs become more connected, cybersecurity updates are essential.

                  Once the update is installed, we perform a system test to confirm all features are working correctly. This includes checking infotainment functions, battery monitoring tools, safety alerts, driver-assist systems, and connectivity options.

                  After the update, you receive a summary explaining what changed, what improvements were added, and how these updates benefit your daily driving. From better performance to faster response times, software updates keep your EV feeling new and modern.`,
  },
  {
    name: "Charging System Check",
    desc: "Inspection of charging ports, cables, and power efficiency.",
    detailedDesc: `The Charging System Check ensures your EV charges safely, efficiently, and consistently. Charging issues can affect battery health, performance, and overall convenience, so checking this system regularly is important.

                  The inspection starts with a detailed examination of the charging port. Our team checks for dust, corrosion, loose components, and any signs of wear. A clean and secure port ensures stable power flow during charging. We also test your charging cable and connectors to confirm they are delivering power properly without overheating or losing efficiency.

                  Next, we analyze the onboard charger, which converts external electricity into power your battery can use. Any issue within this system can slow down charging or damage battery cells. We run diagnostic tests to verify that the charger is functioning correctly and delivering the appropriate voltage and current levels.

                  We also perform a charging speed test to see how quickly your EV charges under normal conditions. If charging is slower than expected, we identify the cause and provide solutions, whether it’s a component issue or calibration problem.

                  Our technicians also evaluate how your battery responds during charging. This includes checking temperature behavior, power intake, and energy flow. Ensuring a healthy charging response helps extend battery life and maintain consistent performance.

                  The service ends with a charging system report that includes findings, recommendations, and tips for safe charging habits. Whether you use home charging or public stations, this service keeps your EV’s charging system dependable and ready for daily use.`,
  },
];

// Custom marker icon for repair shops
const repairShopIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const apiURL = import.meta.env.VITE_API_URL;

/**
 * A page component that displays a list of available services and repair shop locations.
 */
const Services: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = () => {
  const { showToast } = useToast();
  const [repairLocations, setRepairLocations] = useState<RepairLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<RepairLocation[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const repairShopSectionRef = React.useRef<HTMLDivElement>(null);

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
      setFilteredLocations(locationsData);
    } catch (error: any) {
      console.error("Failed to fetch repair locations:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to load repair locations";
      showToast({
        text: errorMessage,
        type: "error",
      });
      setRepairLocations([]);
      setFilteredLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      setFilteredLocations(repairLocations);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = repairLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.address.toLowerCase().includes(lowerQuery) ||
        loc.seller_id?.business_name.toLowerCase().includes(lowerQuery)
    );
    setFilteredLocations(filtered);
  }, [searchQuery, repairLocations]);

  // Calculate map center based on locations or default to Sri Lanka center
  const defaultCenter: L.LatLngExpression = [7.8731, 80.7718]; // Center of Sri Lanka
  const mapCenter: L.LatLngExpression =
    filteredLocations.length > 0
      ? [
          filteredLocations.reduce((sum, loc) => sum + loc.latitude, 0) /
            filteredLocations.length,
          filteredLocations.reduce((sum, loc) => sum + loc.longitude, 0) /
            filteredLocations.length,
        ]
      : defaultCenter;

  const handleLearnMore = (service: Service) => {
    setSelectedService(service);
  };

  const closeModal = () => {
    setSelectedService(null);
  };

  const scrollToRepairShops = () => {
    repairShopSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="space-y-6">
      {/* Services Section */}
      <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          Our Services
        </h1>
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
              <button
                onClick={() => handleLearnMore(service)}
                className="mt-4 text-blue-600 font-semibold hover:underline dark:text-blue-400"
              >
                Learn More
              </button>
            </div>
          ))}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg md:col-span-2 hover:shadow-lg transition-shadow duration-300 dark:bg-blue-900/20 dark:border-blue-700">
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
              Repair Shop Locator
            </h3>
            <p className="text-blue-700 mt-2 dark:text-blue-300">
              Find repair shops near you or along your route. Our network is
              always growing.
            </p>
            <button 
              onClick={scrollToRepairShops}
              className="mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              Find a Repair Shop
            </button>
          </div>
        </div>
      </div>

      {/* Repair Shop Locations Section */}
      <div 
        ref={repairShopSectionRef}
        className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-3xl font-bold dark:text-white">
            Repair Shop Locations
          </h2>
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Search by name, shop, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <p className="text-gray-600 mb-6 dark:text-gray-400">
          Find authorized repair shops near you. All locations are verified and
          active.
        </p>

        {isLoadingLocations ? (
          <div className="flex justify-center items-center py-20">
            <Loader size={60} color="#4f46e5" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">
              {repairLocations.length === 0
                ? "No repair shop locations available at the moment."
                : "No locations match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map View */}
            <div
              className="w-full h-96 border-2 border-gray-300 rounded-lg overflow-hidden dark:border-gray-600 isolate"
              style={{ zIndex: 1 }}
            >
              <MapContainer
                key={searchQuery} // Force re-render on search change to update center
                center={mapCenter}
                zoom={filteredLocations.length > 1 ? 8 : 10}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredLocations.map((location) => (
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
                            <span className="text-sm">
                              🕒 {location.operating_hours}
                            </span>
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
              {filteredLocations.map((location) => (
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
                        {location.seller_id?.business_name
                          ?.charAt(0)
                          .toUpperCase() || "R"}
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

      {/* Service Details Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center z-[9999] p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
            >
              {/* Modal Header */}
              <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedService.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedService.desc}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Service Details
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {selectedService.detailedDesc || selectedService.desc}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  onClick={closeModal}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Services;
