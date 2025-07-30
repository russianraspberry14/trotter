## TrotMate- Plan roadtrips without a headache!

## Inspiration

Planning road trips should feel exciting, but too often, it becomes a chore. Most existing tools either optimize the fastest route or let you add stops manually, but they don’t help with where to stop or what to do there. We built TrotMate to bridge that gap, giving travelers control, clarity, and convenience when planning multi-day drives.


## What it does

TrotMate allows users to:
	•	Enter a start and end location, plus a max daily drive time.
	•	Automatically split the trip into manageable daily segments.
	•	Suggest hotels and restaurants near each stop using the Google Places API.
	•	Display everything on a dynamic map: from route segments to custom markers.
	•	Let users select hotels for each night and finalize the trip plan visually.
        •	Export to Google Maps: Generate a sharable trip link or .kml file.


## How we built it
	•	Frontend: React + Vite + Tailwind CSS
	•	Map & Location Data: Google Maps JavaScript API, Places API, and Directions API
	•	Trip Segmentation:
We parsed each route’s legs and steps, using drive time to decide stop points.
For each stop, we fetched nearby hotels and restaurants using lat/lng from that segment.

## Challenges we ran into
	•	Parsing the Directions API response to get accurate cumulative drive times.
	•	Deciding where to place hotel suggestions — balancing driving convenience with location quality.
	•	Managing shared state across route segments and user selections in React.
	•	Avoiding clutter in the map while still showing useful markers.


## Accomplishments that we’re proud of
	•	Fully functional trip segmenting that works across paths **all over the world**.
	•	Intuitive interface that lets users visualize, edit, and complete their road trip plans.
	•	Dynamic fetching and filtering of **real-time hotel** and restaurant data.
	•	Scalable architecture: adding user preferences or international support would be seamless.

## What we learned
	•	How to effectively use multiple layers of the Google Maps Platform (routes + places + markers).
	•	How to compute location-based logic (e.g., where to stop) based on real-world travel constraints.
	•	How to manage dynamic UIs in React with asynchronous external data.
	•	Designing around user needs first, not just features.


## What’s next for TrotMate
	•	Itinerary PDF: Auto-generate a print-ready itinerary with hotels and places to eat.
	•	Mobile version: Optimize for on-the-go planning.
	•	Collaborative planning: Let friends or family co-edit a trip.
	•	User personalization: Filter results based on past behavior or ratings.
