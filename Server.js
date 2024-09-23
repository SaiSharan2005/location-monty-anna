// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const filePath = './locations.json';

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// Load existing locations from file
const loadLocations = () => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        return JSON.parse(dataBuffer);
    } catch (err) {
        return []; // Return an empty array if the file doesn't exist or is empty
    }
};

// Save new location to file
const saveLocation = (location) => {
    const locations = loadLocations();
    locations.push(location);
    fs.writeFileSync(filePath, JSON.stringify(locations, null, 2));
};

// Serve the location capture page
app.get('/capture', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Location Capture</title>
        <script>
            // Function to send location data to the server
            function sendLocationToServer(latitude, longitude) {
                const url = '/location'; // Server URL
                const data = { lat: latitude, lon: longitude };

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                    document.getElementById('status').innerText = "Location sent successfully!";
                })
                .catch((error) => {
                    console.error('Error:', error);
                    document.getElementById('status').innerText = "Error sending location.";
                });
            }

            // Function to get the user's location
            function getLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(position => {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;
                        console.log(\`Latitude: \${latitude}, Longitude: \${longitude}\`);

                        // Send the location to the server
                        sendLocationToServer(latitude, longitude);
                    }, error => {
                        console.error('Error getting location:', error);
                        document.getElementById('status').innerText = "Error getting location.";
                    });
                } else {
                    console.error("Geolocation is not supported by this browser.");
                    document.getElementById('status').innerText = "Geolocation is not supported by this browser.";
                }
            }

            // Load the stored locations when the page loads
            window.onload = () => {
                getLocation();
            };
        </script>
    </head>
    <body>
        <h1>Location Capture</h1>
        <p>Your current location will be sent to the server automatically.</p>
        <p id="status">Getting your location...</p>
        </body>
        </html>
        `);
    });
    
    // <p><a href="/locations">View All Locations</a></p>
// Serve the page to view all stored locations
app.get('/locations', (req, res) => {
    const locations = loadLocations();
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stored Locations</title>
    </head>
    <body>
        <h1>Stored Locations</h1>
        <ul>
            ${locations.map(location => `<li>Latitude: ${location.lat}, Longitude: ${location.lon}, Time: ${location.timestamp}</li>`).join('')}
        </ul>
        <p><a href="/capture">Capture New Location</a></p>
    </body>
    </html>
    `);
});

// POST route to receive location data
app.post('/location', (req, res) => {
    const { lat, lon } = req.body;
    console.log(`Received location: Latitude = ${lat}, Longitude = ${lon}`);

    const location = { lat, lon, timestamp: new Date().toISOString() };
    saveLocation(location);

    res.json({ message: 'Location received and stored', success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
