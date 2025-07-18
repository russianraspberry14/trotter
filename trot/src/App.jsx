import './App.css'
import { LoadScript, Autocomplete, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { useRef, useState } from 'react';
import { Marker } from '@react-google-maps/api';
import Select from 'react-select'
import makeAnimated from 'react-select/animated'

const GOOGLE_MAPS_API_KEY = 'AIzaSyDJgcNJlKIe8TkTpXRhPQb15hSxggk_KII';
function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const animatedComponents = makeAnimated();
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [directions, setDirections] = useState(null);
  const [pcuisines, setpCuisines] = useState([''])
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
    if (!directions || !mapRef.current || pcuisines.length === 0) return;
  
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    const path = directions.routes[0].overview_path;
    const sampledPoints = path.filter((_, i) => i % 20 === 0); // Sample points
  
    const collectedResults = new Set();
    const allRestaurants = [];
  
    sampledPoints.forEach((point) => {
      pcuisines.forEach((cuisine) => {
        const request = {
          location: point,
          radius: 5000,
          keyword: `${cuisine} restaurant`,
          type: "restaurant",
        };
  
        service.nearbySearch(request, (results, status) => {
          if (status === "OK" && results) {
            results.forEach((r) => {
              if (!collectedResults.has(r.place_id)) {
                collectedResults.add(r.place_id);
                allRestaurants.push(r);
                setRestaurants((prev) => [...prev, r]); // Append to state
              }
            });
          }
        });
      });
    });
  };
  
const getRoute = () => {
  if (!start || !end) return;
  const directionsService = new window.google.maps.DirectionsService();

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
  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
    <div className='flex flex-col w-screen h-screen'>
      {/* //Navbar */}
      <div className="bg-white flex flex-row m-[40px] justify-between">
        {/* here's the logo */}
        <img src = "/logo.svg" className="h-[40px] ml-[20px] hover:drop-shadow-[2px_2px_10px_rgba(0,0,0,0.8)] hover:cursor-pointer duration-[500ms]"/>
        <div className='flex flex-row gap-30'>
          <button className=' font-["Josefin_Slab"] font-bold border-[2px] rounded-3xl p-[15px] bg-[#FAAF3A] hover:bg-[#FFFFFF] hover:text-[#FAAF3A] hover:cursor-pointer duration-[500ms] border-[#FAAF3A] text-[#FFFFFF] text-[20px]'>Features</button>
          <button className=' font-["Josefin_Slab"] font-bold border-[2px] rounded-3xl px-[25px] py-[15px] bg-[#FAAF3A] hover:bg-[#FFFFFF] hover:text-[#FAAF3A] hover:cursor-pointer duration-[500ms] border-[#FAAF3A] text-[20px] text-[#FFFFFF]'>Try it out!</button>
          <button className=' font-["Josefin_Slab"] font-bold border-[2px] rounded-3xl px-[25px] py-[15px] bg-[#FAAF3A] hover:bg-[#FFFFFF] hover:text-[#FAAF3A] hover:cursor-pointer duration-[500ms] border-[#FAAF3A] text-[20px] text-[#FFFFFF]'>Login</button>
        </div>
      </div>
      {/* Login arrow */}
      <div className='w-full h-[100px]'>
        <img src="/login.svg" className='h-[100px] absolute right-10'></img>
      </div>
        

      {/* Description and welcome */}

      {/* input output and display routes */}
      
        <div className='flex flex-row gap-10 align-center ml-[300px] mb-[50px]'>
          <Autocomplete onPlaceChanged={handleStartPlaceChanged} onLoad={(autocomplete)=>(startRef.current = autocomplete)}>
            <input type='text' id='start' className='clearable border-[2px] border-[#FF921E] border-dashed rounded-4xl px-4 py-3 w-[300px]' placeholder='Start Destination'/>
          </Autocomplete>
          <img src='./arrow.svg' className='h-[40px]'/>
          <Autocomplete onPlaceChanged={handleEndPlaceChanged} onLoad={(autocomplete)=>(endRef.current = autocomplete)}>
            <input type='text' id='end' className='clearable border-[2px] border-[#FF921E] rounded-4xl px-4 py-3 w-[300px]' placeholder='Final Destination'/>
          </Autocomplete>
          <input onClick={getRoute} type="submit" className='text-[#FFFFFF] bg-[#FF921E] rounded-4xl px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#FF921E] hover:cursor-pointer duration-[500ms]'></input>
        </div>
        <div className='w-full h-full m-[50px]'>
          <GoogleMap onLoad={(map) => (mapRef.current = map)} className="border-[10px] border-[#000000] w-full"center={start || defaultCenter} zoom={10} mapContainerStyle={{  width: '80%', height: '500px' }}>
              {directions && <DirectionsRenderer directions={directions} />}
              {selectedPlace && (
                <Marker
                  position={selectedPlace.geometry.location}
                  title={selectedPlace.name}
                />
              )}
          </GoogleMap>
        </div>
      

      {/* Getting the restaurants preferences: number of restaurants and the preferred cuisines from drop down */}
      <div className='w-full'>
        <p>how many food stops would you like to have: </p>
        <input type='number' min='0' max='100' placeholder="How many food stops?"></input>
        <p>what are your preferred cuisines? (Select atleast 2)</p>
        <Select
          components={animatedComponents}
          isMulti
          options={options}
          onChange={handleCuisines}
        />
        <input onClick={getRoute} type="submit" className='text-[#FFFFFF] bg-[#FF921E] rounded-4xl px-4 py-3 hover:bg-[#FFFFFF] hover:text-[#FF921E] hover:cursor-pointer duration-[500ms]'></input>

      </div>
      <div className="restaurant-list p-4 max-h-96 overflow-y-auto">
        {restaurants.map((r, index) => (
          <div
            key={r.place_id}
            className="cursor-pointer p-2 border-b hover:bg-gray-200"
            onClick={() => setSelectedPlace(r)}
          >
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-gray-600">{r.vicinity}</p>
          </div>
        ))}
      </div>

      {/* fuel and cost estimation */}
      <div className='z-10 m-[40px]'><p>here's your estimated fuel usage</p></div>
      {/* Footer */}
      <div className=' w-full text-[#FFFFFF] bg-[#FAAF3A] py-[15px] font-["Josefin_Slab"] relative left-0 bottom-0 flex justify-end '>
        <p className='mr-[10px]'>© Ekansh Sahu 2025</p>
      </div>
    </div>
    </LoadScript>
  )
}

export default App

