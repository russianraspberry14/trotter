import './App.css'
import { LoadScript, Autocomplete, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { useRef, useState } from 'react';
import { Marker } from '@react-google-maps/api';
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import { useEffect } from 'react';
import TripCostCalculator from './TripCostCalculator'; 
import GoogleMapsButton from './GoogleMapsButton.jsx';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDJgcNJlKIe8TkTpXRhPQb15hSxggk_KII';
function App() {
  const [maxHours, setMaxHours] = useState(8); // default 8 hours
  const [minStars, setMinStars] = useState(3);
  const [maxPriceLevel, setMaxPriceLevel] = useState(3); // Google uses 0–4
  const [hotelSuggestions, setHotelSuggestions] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState({});
  const [numStops, setNumStops] = useState(2); // default to 2 stops
  const [restaurants, setRestaurants] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const animatedComponents = makeAnimated();
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [directions, setDirections] = useState(null);
  const [pcuisines, setpCuisines] = useState([''])
  const nextSectionRef = useRef(null);
  let totalDurationSec = 0;
  if (directions && directions.routes && directions.routes[0]) {
    totalDurationSec = directions.routes[0].legs.reduce(
      (sum, leg) => sum + leg.duration.value,
      0
    );
  }
  const mapRef = useRef(null);
  const defaultCenter = { lat: 28.6139, lng: 77.2090 };
  const startRef = useRef();
  const endRef = useRef();
  const cuisines = [
    "Italian",
    "Chinese",
    "Mexican",
    "Indian",
    "Thai",
    "French",
    "Japanese",
    "Greek",
    "Mediterranean",
    "Vietnamese",
    "Korean",
    "American",
    "Spanish",
    "Turkish",
    "Lebanese",
  ];
  const options = cuisines.map(c => ({ label: c, value: c }));
//   function getHotelStopIndices(directions, maxDriveSeconds) {
//     if (!directions?.routes?.[0]?.legs) {
//       console.log('No route legs available');
//       return [];
//     }
    
//     const stops = [];
//     let cumulativeTime = 0;
//     const legs = directions.routes[0].legs;
    
//     console.log(`Checking ${legs.length} legs for hotel stops. Max drive time: ${maxDriveSeconds} seconds (${maxDriveSeconds/3600} hours)`);
  
//     for (let i = 0; i < legs.length; i++) {
//       const legDuration = legs[i].duration.value;
//       cumulativeTime += legDuration;
      
//       console.log(`Leg ${i + 1}: ${legDuration}s, Cumulative: ${cumulativeTime}s`);
      
//       // If we've exceeded max drive time, suggest a hotel stop
//       if (cumulativeTime >= maxDriveSeconds) {
//         stops.push(i); // Stop after this leg
//         console.log(`Hotel stop needed after leg ${i + 1}`);
//         cumulativeTime = 0; // Reset for next segment
//       }
//     }
//     console.log(`Total hotel stops needed: ${stops.length}`);
//   return stops;
// }
function getHotelStopPoints(directions, maxDriveSeconds) {
  if (!directions?.routes?.[0]?.legs) {
    console.log('No route legs available');
    return [];
  }

  const legs = directions.routes[0].legs;
  const stopPoints = [];
  let cumulativeTime = 0;
  let totalTime = 0;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const steps = leg.steps || [];

    for (let step of steps) {
      const stepDuration = step.duration.value;
      const stepStart = step.start_location;
      totalTime += stepDuration;
      cumulativeTime += stepDuration;

      if (cumulativeTime >= maxDriveSeconds) {
        // Save this step start point as a hotel stop
        const lat = typeof stepStart.lat === 'function' ? stepStart.lat() : stepStart.lat;
        const lng = typeof stepStart.lng === 'function' ? stepStart.lng() : stepStart.lng;
        stopPoints.push({ lat, lng, atTime: totalTime });

        cumulativeTime = 0;
      }
    }
  }

  console.log(`Calculated ${stopPoints.length} hotel stops by duration.`);
  return stopPoints;
}
  async function fetchFilteredHotelsWithPlacesService(lat, lng, minStars, maxPriceLevel, mapRef) {
    return new Promise((resolve) => {
      if (!mapRef.current) {
        console.error('Map not loaded yet');
        resolve([]);
        return;
      }
  
      if (!window.google?.maps?.places?.PlacesService) {
        console.error('Google Places Service not available');
        resolve([]);
        return;
      }
  
      const service = new window.google.maps.places.PlacesService(mapRef.current);
      
      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius: 15000,
        type: 'lodging'
      };
  
      console.log(`Searching for hotels at lat: ${lat}, lng: ${lng}`);
  
      service.nearbySearch(request, (results, status) => {
        console.log('Places service status:', status);
        console.log('Raw results:', results);
  
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`Found ${results.length} total hotels`);
          
          const filtered = results.filter(h => {
            const rating = h.rating || 0;
            const priceLevel = h.price_level ?? 0;
            const meetsRating = rating >= minStars;
            const meetsPrice = priceLevel <= maxPriceLevel;
            
            console.log(`Hotel: ${h.name}, Rating: ${rating}, Price: ${priceLevel}, Meets criteria: ${meetsRating && meetsPrice}`);
            
            return meetsRating && meetsPrice;
          });
          
          console.log(`${filtered.length} hotels match your criteria`);
          resolve(filtered);
        } else {
          console.error('Places service error:', status);
          if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log('No hotels found in this area');
          } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            console.error('Google Places API quota exceeded');
          }
          resolve([]);
        }
      });
    });
  }

  async function suggestHotelStops(directions, maxHours, minStars, maxPriceLevel, mapRef) {
    if (!directions?.routes?.[0]?.legs) {
      console.log('No route data available');
      return [];
    }
  
    const maxDriveSeconds = maxHours * 3600;
    // const stopIndices = getHotelStopIndices(directions, maxDriveSeconds);
    
    // if (stopIndices.length === 0) {
    //   console.log(`No hotel stops needed - total drive time is less than ${maxHours} hours`);
    //   return [];
    // }
  
    // console.log(`Found ${stopIndices.length} hotel stop(s) needed at leg indices:`, stopIndices);
    
    const suggestions = [];
  
    const stopPoints = getHotelStopPoints(directions, maxDriveSeconds);


    for (let i = 0; i < stopPoints.length; i++) {
      const { lat, lng } = stopPoints[i];

      console.log(`Searching for hotels near stop ${i + 1} at`, { lat, lng });

      try {
        const hotels = await fetchFilteredHotelsWithPlacesService(lat, lng, minStars, maxPriceLevel, mapRef);
        suggestions.push({
          stopIndex: i, // not legIndex anymore
          location: { lat, lng },
          options: hotels.slice(0, 8)
        });
      } catch (error) {
        console.error(`Error fetching hotels for stop ${i + 1}:`, error);
        suggestions.push({
          stopIndex: i,
          location: { lat, lng },
          options: []
        });
      }
    }

  
    return suggestions;
  }
  
  useEffect(() => {
    if (!directions) {
      console.log('No directions available for hotel suggestions');
      setHotelSuggestions([]); // Clear previous suggestions
      return;
    }
  
    if (!mapRef.current) {
      console.log('Map not loaded yet, waiting...');
      return;
    }
  
    console.log('Generating hotel suggestions with params:', {
      maxHours,
      minStars,
      maxPriceLevel,
      totalLegs: directions.routes[0].legs.length
    });
  
    const run = async () => {
      try {
        setHotelSuggestions([]); 
        const suggestions = await suggestHotelStops(directions, maxHours, minStars, maxPriceLevel, mapRef);
        console.log('Hotel suggestions generated:', suggestions);
        setHotelSuggestions(suggestions);
      } catch (error) {
        console.error('Error generating hotel suggestions:', error);
        setHotelSuggestions([]);
      }
    };
  
    const timeoutId = setTimeout(run, 1500);
    
    return () => clearTimeout(timeoutId);
  }, [directions, maxHours, minStars, maxPriceLevel]);
  
  function handleSelectHotel(stopIndex, hotel) {
    setSelectedHotels(prev => ({ ...prev, [stopIndex]: hotel }));
  }
  const handleStartPlaceChanged = () => {
    if (!startRef.current) return;
    const place = startRef.current.getPlace();
    console.log('Start:', place.formatted_address);
    if (place?.geometry?.location) {
      setStart(place.geometry.location);
    }
  };

  const handleEndPlaceChanged = () => {
    if (!endRef.current) return;
    const place = endRef.current.getPlace();
    console.log('End:', place.formatted_address);
    if (place?.geometry?.location) {
      setEnd(place.geometry.location);
    }
  };
  const handleCuisines = (selections) => {
    setpCuisines(selections.map(opt => opt.value))
  }
  const getRestaurantsAlongRoute = () => {
    if (!directions || !mapRef.current || pcuisines.length === 0 || numStops < 1) return;
  
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    const path = directions.routes[0].overview_path;
  
    // Get n nearly equally spaced points
    const interval = Math.floor(path.length / (numStops + 1));
    const sampledPoints = Array.from({ length: numStops }, (_, i) => path[(i + 1) * interval]);
  
    const collectedResults = new Set();
    const selectedRestaurants = [];
  
    sampledPoints.forEach((point, idx) => {
      pcuisines.forEach((cuisine) => {
        const request = {
          location: point,
          radius: 5000,
          keyword: `${cuisine} restaurant`,
          type: "restaurant",
        };
  
        service.nearbySearch(request, (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            // sort by rating and pick top
            const topRated = results
              .filter(r => !collectedResults.has(r.place_id))
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  
            if (topRated) {
              collectedResults.add(topRated.place_id);
              selectedRestaurants.push(topRated);
              setRestaurants(prev => [...prev, topRated]);
            }
          }
        });
      });
    });
  };
  
const getRoute = () => {
  if (!start || !end) return;
  const directionsService = new window.google.maps.DirectionsService();
  const section = document.getElementById("mapSection");
  section?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    document.getElementById("rest_pref")?.scrollIntoView({ behavior: "smooth" });
  }, 2000); // delay in milliseconds
  directionsService.route(
    {
      origin: start,
      destination: end,
      travelMode: window.google.maps.TravelMode.DRIVING,
    },
    (result, status) => {
      if (status === "OK") {
        setDirections(result);
        setTimeout(() => getRestaurantsAlongRoute(), 1000);
      } else {
        console.error("Directions request failed due to " + status);
      }
    }
  );
};
const mapStyles = [
  // Example dark map style (replace with your preferred style JSON or use mapId).
  { elementType: "geometry", stylers: [{ color: "#2d2d2d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  // ... add more styling as needed
];

return (
  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
    <div className="flex flex-col min-h-screen max-w-full bg-gray-50">
      {/* Navbar */}
      <div className="bg-white flex flex-row items-center justify-between mb-20 px-10 py-4 shadow-md z-10">
        <img src="/logo.svg" className="h-10 ml-4 cursor-pointer transition-shadow duration-500 hover:drop-shadow-[2px_2px_10px_rgba(0,0,0,0.8)]" />
        <div className="flex flex-row gap-6">
          <button className='font-["Times New Roman"] border-2 rounded-3xl px-10 py-4 bg-[#FAAF3A] hover:bg-white hover:text-[#FAAF3A] hover:shadow-md border-[#FAAF3A] text-white text-lg transition-colors duration-500'>Features</button>
          <button className='font-["Times New Roman"] border-2 rounded-3xl px-10 py-4 bg-[#FAAF3A] hover:bg-white hover:text-[#FAAF3A] hover:shadow-md border-[#FAAF3A] text-white text-lg transition-colors duration-500'>Try it out!</button>
        </div>
      </div>

      {/* Route input, output */}
      <div className="flex flex-row items-center gap-8 ml-100 mb-12">
        <Autocomplete onPlaceChanged={handleStartPlaceChanged} onLoad={autocomplete => (startRef.current = autocomplete)}>
          <input type="text" id="start" className="border-2 border-[#FF921E] rounded-xl px-5 py-3 w-72 focus:outline-none focus:ring-2 focus:ring-[#FF921E] transition" placeholder="Start Destination" />
        </Autocomplete>
        <img src="./arrow.svg" className="h-10" />
        <Autocomplete onPlaceChanged={handleEndPlaceChanged} onLoad={autocomplete => (endRef.current = autocomplete)}>
          <input type="text" id="end" className="border-2 border-[#FF921E] rounded-xl px-5 py-3 w-72 focus:outline-none focus:ring-2 focus:ring-[#FF921E] transition" placeholder="Final Destination" />
        </Autocomplete>
        <input onClick={getRoute} type="submit" value="Travel!" className="text-white bg-[#FF921E] rounded-3xl px-5 py-3 font-medium hover:bg-white hover:text-[#FF921E] hover:border-[#FF921E] hover:border-2 hover:shadow-md cursor-pointer transition-colors duration-500" />
      </div>
      <div className="w-full flex justify-center m-8">
        <div className="rounded-3xl shadow-2xl border-4 border-white overflow-hidden w-[80vw] max-w-7xl">
          <GoogleMap id= "mapSection"
            onLoad={map => (mapRef.current = map)}
            className="w-full"
            center={start || defaultCenter}
            zoom={10}
            mapContainerStyle={{ width: "100%", height: "500px" }}
            options={{
              styles: mapStyles, // or: mapId: "YOUR_MAP_ID",
              disableDefaultUI: false,
              zoomControl: true,
              fullscreenControl: true,
              mapTypeControl: false,
              streetViewControl: false
            }}
          >
            {directions && <DirectionsRenderer directions={directions} />}
            {selectedPlaces.map(r => (
              <Marker key={r.place_id} position={r.geometry.location} title={r.name} />
            ))}
            {Object.values(selectedHotels).map(h => (
              <Marker key={h.place_id} position={h.geometry.location} title={h.name} />
            ))}
          </GoogleMap>
        </div>
      </div>

      {/* Restaurant preferences */}
      <div 
      id="rest_pref" 
      className="w-full flex flex-col items-start p-10 
                bg-gradient-to-br from-slate-50 to-stone-50
                border border-amber-200 
                m-4 rounded-2xl shadow-lg
                hover:shadow-xl transition-all duration-300"
    >
      {/* Elegant header */}
      <div className="w-full mb-8 pb-4 border-b border-amber-100">
        <h2 className="text-2xl font-light text-slate-800 tracking-wide">
          Dining Preferences
        </h2>
        <p className="text-slate-500 text-sm font-light mt-1">
          Curate your culinary journey
        </p>
      </div>

      <div className="flex flex-row justify-between w-full gap-12">
        {/* Number of stops section */}
        <div className="flex-1">
          <label className="block text-slate-700 font-medium mb-3 text-sm tracking-wide">
            Number of Dining Stops
          </label>
          <input
            value={numStops}
            onChange={e => setNumStops(parseInt(e.target.value))}
            type="number"
            min="0"
            max="100"
            placeholder="Enter quantity"
            className="w-full border border-slate-200 rounded-lg px-4 py-3 
                      text-slate-700 placeholder-slate-400
                      focus:border-amber-300 focus:ring-2 focus:ring-amber-100
                      bg-white shadow-sm
                      transition-all duration-200
                      hover:border-slate-300 font-light"
          />
        </div>

        {/* Cuisine preferences section */}
        <div className="flex-1">
          <label className="block text-slate-700 font-medium mb-3 text-sm tracking-wide">
            Preferred Cuisines
            <span className="text-xs text-slate-400 font-light ml-2">
              (Minimum 2 selections)
            </span>
          </label>
          <div className="w-full">
            <Select 
              components={animatedComponents} 
              isMulti 
              options={options} 
              onChange={handleCuisines} 
              className="w-full"
              styles={{
                control: (base, state) => ({
                  ...base,
                  background: 'white',
                  border: state.isFocused ? '2px solid #fcd34d' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  boxShadow: state.isFocused 
                    ? '0 0 0 2px rgba(252, 211, 77, 0.1)' 
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  minHeight: '48px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#9ca3af'
                  }
                }),
                multiValue: (base) => ({
                  ...base,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#475569',
                  fontWeight: '400',
                  fontSize: '14px',
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                  },
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#94a3b8',
                  fontWeight: '300',
                }),
              }}
            />
          </div>
        </div>
      </div>

  {/* Submit button */}
  <div className="w-full flex justify-center mt-10">
    <button
      onClick={getRoute}
      className="px-8 py-3 text-white font-medium tracking-wide
                 bg-gradient-to-r from-amber-400 to-orange-400
                 rounded-lg shadow-md
                 hover:from-amber-500 hover:to-orange-500
                 hover:shadow-lg hover:-translate-y-0.5
                 active:translate-y-0
                 transition-all duration-200
                 border border-amber-300/50
                 focus:outline-none focus:ring-2 focus:ring-amber-200"
    >
      Plan Dining Route
    </button>
  </div>

  {/* Horizontally scrollable restaurants */}
    <div className="restaurant-list px-10 py-4 overflow-x-auto hide-scrollbar w-full flex flex-row gap-6">
      {restaurants.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).map(r => {
        const photoRef = r.photos?.[0]?.photo_reference;
        const photoObj = r.photos?.[0];
        const photoUrl = photoObj?.getUrl
          ? photoObj.getUrl({ maxWidth: 400 })
          : '/fallback-image.jpg';
    
        const placeUrl = `https://www.google.com/maps/place/?q=place_id:${r.place_id}`;
        
          console.log('Restaurant:', r.name);
          console.log('r.photos:', r.photos);
          console.log('photoObj:', photoObj);
          console.log('photoObj.getUrl:', photoObj?.getUrl);
          console.log(
            'getUrl({maxWidth:400}):',
            photoObj && typeof photoObj.getUrl === 'function'
              ? photoObj.getUrl({ maxWidth: 400 })
              : 'no getUrl fn'
          );

        const isSelected = selectedPlaces.some(sel => sel.place_id === r.place_id);

        return (
          <div
            key={r.place_id}
            onClick={() => {
              setSelectedPlaces(prev => {
                const exists = prev.some(sel => sel.place_id === r.place_id);
                return exists
                  ? prev.filter(sel => sel.place_id !== r.place_id)
                  : [...prev, r];
              });
            }}
            className={`min-w-[320px] max-w-xs bg-white rounded-2xl border flex-shrink-0 flex flex-col cursor-pointer transition-all duration-300 ${
              isSelected
                ? 'border-orange-400 shadow-lg ring-2 ring-orange-300'
                : 'border-gray-200 shadow-md hover:shadow-lg'
            }`}
          >
            <img src={photoUrl}
              onError={e => {
                e.currentTarget.onerror = null; // Avoid infinite fallbacks
                e.currentTarget.src = '/fallback-image.png';
              }}
              alt={r.name} className="w-full h-40 object-cover rounded-t-2xl" />
            <div className="p-4">
              <a href={placeUrl} target="_blank" rel="noopener noreferrer">
                <h3 className="font-bold text-lg text-blue-600 hover:underline">{r.name}</h3>
              </a>
              <p className="text-sm text-gray-600">{r.vicinity}</p>
              <p className="text-sm text-yellow-600">
                ⭐ {r.rating ?? 'N/A'} ({r.user_ratings_total ?? 0} reviews)
              </p>
            </div>
          </div>
        );
      })}
    </div>

</div>

      

      {/* Hotels section preferences */}
      <div className="bg-gray-50 rounded-xl shadow-sm">
        <div className="px-10 py-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Select hotels to stay in!</h2>
          
          {/* Preferences controls */}
          <div className="flex flex-wrap gap-6 mb-6 p-6 bg-white rounded-lg border border-gray-200">
            <label className="flex items-center text-gray-800 font-medium">
              Max Drive Hours per Day:
              <input
                type="number"
                min={1}
                max={16}
                value={maxHours}
                onChange={e => setMaxHours(Number(e.target.value))}
                className="ml-3 border border-[#FF921E] rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-[#FF921E] transition"
              />
            </label>

            <label className="flex items-center text-gray-800 font-medium">
              Minimum Hotel Rating:
              <input
                type="number"
                step={0.1}
                min={1}
                max={5}
                value={minStars}
                onChange={e => setMinStars(Number(e.target.value))}
                className="ml-3 border border-[#FF921E] rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-[#FF921E] transition"
              />
            </label>

            <label className="flex items-center text-gray-800 font-medium">
              Max Price Level (0–4):
              <input
                type="number"
                min={0}
                max={4}
                value={maxPriceLevel}
                onChange={e => setMaxPriceLevel(Number(e.target.value))}
                className="ml-3 border border-[#FF921E] rounded-lg px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-[#FF921E] transition"
              />
            </label>
          </div>

          {/* Hotel suggestions */}
          {hotelSuggestions.map((stop, i) => (
            <div key={i} className="mb-8">
              <div className="flex flex-row gap-6 overflow-x-auto hide-scrollbar scroll-smooth pb-2">
                {stop.options.length === 0 ? (
                  <div className="text-gray-400 flex-shrink-0 min-w-[320px] flex items-center justify-center text-sm italic">
                    No matching hotels found.
                  </div>
                ) : (
                  stop.options.map(hotel => {
                    const photoObj = hotel.photos?.[0];
                    const hotelPhoto = photoObj ? photoObj.getUrl() : '/fallback-image.png';
                    // const isSelected = selectedHotels[stop.legIndex]?.place_id === hotel.place_id;
                    const isSelected = selectedHotels[stop.stopIndex]?.place_id === hotel.place_id;

                    return (
                      <div
                        key={hotel.place_id}
                        onClick={() => handleSelectHotel(stop.stopIndex, hotel)}
                        className={`min-w-[320px] max-w-xs bg-white rounded-2xl border flex-shrink-0 flex flex-col cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'border-yellow-500 shadow-xl ring-2 ring-yellow-300'
                            : 'border-gray-200 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <img
                          src={hotelPhoto}
                          alt={hotel.name}
                          className="w-full h-44 object-cover rounded-t-2xl"
                        />
                        <div className="p-4 flex flex-col gap-1">
                          <h4 className="font-semibold text-gray-800 text-base">{hotel.name}</h4>
                          <p className="text-sm text-gray-600">Rating: {hotel.rating}</p>
                          <p className="text-sm text-gray-600">
                            Price Level: {hotel.price_level ?? "N/A"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
          <ul>
          {Object.entries(selectedHotels).map(([stopIndex, hotel]) => (
            <li key={stopIndex}>
              Stop {Number(stopIndex) + 1}: {hotel.name}
            </li>
          ))}
        </ul>

        </div>
      </div>


      {/* Fuel and cost estimation */}
      <div ref={nextSectionRef} className="z-10 m-10 bg-white p-6 rounded-2xl shadow w-full max-w-2xl mx-auto">
        <p className="font-bold mb-3">Here's your estimated fuel usage</p>
        <TripCostCalculator
          directions={directions}
          selectedHotels={selectedHotels}
          selectedPlaces={selectedPlaces}
          totalDurationSec={totalDurationSec}
        />
      </div>
      <GoogleMapsButton
        origin={start}
        destination={end}
        selectedHotels={selectedHotels}
        selectedRestaurants={restaurants}
      />
      {/* Footer */}
      <div className='w-full text-white bg-[#FAAF3A] py-4 font-["Josefin_Slab"] left-0 bottom-0 flex justify-end relative'>
        <p className='mr-4'>© Ekansh Sahu 2025</p>
      </div>
    </div>
  </LoadScript>
);


}

export default App

