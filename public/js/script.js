const socket = io();
const map = L.map("map").setView([0, 0], 16);

// Add OpenStreetMap tile layer to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Object to store markers by user ID
const markers = {};

// Function to handle geolocation success
const handleLocationSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    console.log(`Your location: ${latitude}, ${longitude}`);
    
    // Set the view to the user's location
    map.setView([latitude, longitude], 16);
    
    // Send the user's location to the server
    socket.emit("send-location", { latitude, longitude });
};

// Function to handle geolocation errors
const handleLocationError = (error) => {
    console.error("Geolocation error:", error.message);
};

// Request the user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
    );

    // Continuously watch for position changes
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        handleLocationError,
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Listen for location updates from other users
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Add a small offset to each marker to prevent overlap
    const offset = 0.0001; // Adjust this value for more or less separation
    const lat = latitude + (Math.random() * offset); // Randomly adjust latitude slightly
    const lng = longitude + (Math.random() * offset); // Randomly adjust longitude slightly

    // Update existing marker or create a new one if it doesn't exist
    if (markers[id]) {
        markers[id].setLatLng([lat, lng]);
    } else {
        // Create a new marker for the user with their ID in the popup
        markers[id] = L.marker([lat, lng]).addTo(map).bindPopup(`User ID: ${id}`).openPopup();
        console.log(`Marker added for user ${id} at ${lat}, ${lng}`);
    }
});

// Handle user disconnection and remove their marker
socket.on("user-disconnected", (id) => {
    console.log(`User disconnected: ${id}`);
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

// Update user list in case a user connects or disconnects
socket.on("update-user-list", (userIds) => {
    console.log("Connected users:", userIds);
});
