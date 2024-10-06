import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  255,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let stateDate = new Date();

// Add orbit controls for camera movement
const controls = new OrbitControls(camera, renderer.domElement);

// Create and add a bright point light at the center of the solar system
const pointLight = new THREE.PointLight(0xffffff, 4000 * 2, 4000 * 2);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Add a raycaster and a mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const highlightedPlanets = new Set(); // To keep track of highlighted planets

// Function to create an orbit for a planet

// Function to create an orbit for a planet
function createOrbit(radius) {
  const curve = new THREE.EllipseCurve(
    0,
    0, // ax, aY
    radius,
    radius, // xRadius, yRadius
    0,
    2 * Math.PI, // aStartAngle, aEndAngle
    false, // aClockwise
    0 // aRotation
  );

  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const ellipse = new THREE.Line(geometry, material);
  ellipse.rotation.x = Math.PI / 2;

  // Initially set emissive properties
  ellipse.material.emissive = new THREE.Color(0x000000);
  ellipse.material.emissiveIntensity = 0;

  scene.add(ellipse);
  return ellipse; // Return the created orbit
}

// Highlighting function in mouse click handler
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planetObjects.map(p => p.object));

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    const planetData = planetObjects.find(p => p.object === planet);
    const orbitLine = planetData.orbit;

    // Highlight or unhighlight the orbit line on click
    if (highlightedPlanets.has(planetData.name)) {
      orbitLine.material.color.set(0xffffff); // Reset to original color
      orbitLine.material.emissive.set(0x000000); // Reset to original emissive
      orbitLine.material.emissiveIntensity = 0; // Reset emissive intensity
      highlightedPlanets.delete(planetData.name);
    } else {
      orbitLine.material.color.set(0xff0000); // Change to red (highlight color)
      orbitLine.material.emissive.set(0xff0000); // Change to red (highlight color)
      orbitLine.material.emissiveIntensity = 1; // Set emissive intensity
      highlightedPlanets.add(planetData.name);
    }
  }
}


// Define the planets with their parameters
let planets = [
  { name: "Mercury", radius: 0.383, distance: 5, apiName: "199" },
  { name: "Venus", radius: 0.949, distance: 7, apiName: "299" },
  { name: "Earth", radius: 1, distance: 10, apiName: "399" },
  { name: "Mars", radius: 0.532, distance: 15, apiName: "499" },
  { name: "Jupiter", radius: 11.21, distance: 52, apiName: "599" },
  { name: "Saturn", radius: 9.45, distance: 95, apiName: "699" },
  { name: "Uranus", radius: 4, distance: 192, apiName: "799" },
  { name: "Neptune", radius: 3.88, distance: 301, apiName: "899" },
];

// Define scaling factors
const factor = 0.1;
const distanceScale = 25 * factor;
const sunRadius = 69.88 * factor;

for (const planet of planets) {
  planet.distance *= distanceScale;
}

// Create the Sun mesh with emissive material
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({
  emissive: 0xffff00,
  emissiveIntensity: 5,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create and add a PointLight at the Sun's position
const sunLight = new THREE.PointLight(0xffffff, 10, 1000);
sunLight.position.copy(sun.position);
sunLight.decay = 2;
scene.add(sunLight);

// Set up camera position
camera.position.z = 100;

// Load textures for planets
const textureLoader = new THREE.TextureLoader();
const planetObjects = planets.map((planet) => {
  const texture = textureLoader.load(
    `/textures/2k_${planet.name.toLowerCase()}.jpg`,
    (texture) => {
      console.log(`${planet.name} texture loaded successfully`);
    },
    undefined,
    (error) => {
      console.error(`Error loading texture for ${planet.name}:`, error);
    }
  );

  const orbit = createOrbit(planet.distance); // Create the orbit for this planet

  return {
    ...planet,
    object: createPlanet(planet.radius, texture, [planet.distance, 0, 0]),
    orbit: orbit // Store reference to orbit
  };
});

// Helper function to create a planet
function createPlanet(radius, texture, position) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    map: texture || null,
    metalness: 0,
    roughness: 1,
    emissive: 0x000000, // Set initial emissive color
  });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.set(...position);
  scene.add(planet);
  return planet;
}

// Function to convert RA/Dec to Cartesian coordinates
function convertStringToCartesian(ra, dec, distance) {
  const raParts = ra.split(" ");
  const decParts = dec.split(" ");

  if (raParts.length < 3 || decParts.length < 1) {
    console.error("Invalid RA or Dec format:", ra, dec);
    return { x: 0, y: 0, z: 0 };
  }

  const hours = parseFloat(raParts[0]);
  const minutes = parseFloat(raParts[1]);
  const seconds = parseFloat(raParts[2]);
  const decDegrees = parseFloat(decParts[0]);

  const totalRAInHours = hours + minutes / 60 + seconds / 3600;
  const totalRAInRadians = (totalRAInHours / 24) * (2 * Math.PI);
  const totalDecInRadians = (decDegrees / 180) * Math.PI;

  const x = distance * Math.cos(totalDecInRadians) * Math.cos(totalRAInRadians);
  const y = distance * Math.cos(totalDecInRadians) * Math.sin(totalRAInRadians);
  const z = distance * Math.sin(totalDecInRadians);

  return { x, y, z };
}

async function updatePlanetPositions() {
  const givenDate = new Date("2021-05-01").toISOString().split("T")[0];
  console.log(`Given date: ${givenDate}`);

  // Store updated planet positions temporarily
  const updatedPositions = [];

  for (const planet of planetObjects) {
    const apiUrl = `http://localhost:3000/planet-data?command=${planet.apiName}&date=${stateDate.toISOString().split("T")[0]}`;
    console.log(apiUrl);

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(`Error fetching data for ${planet.name}: ${response.statusText}`);
        continue; // Skip to the next planet
      }

      const data = await response.json();

      if (data.result) {
        const lines = data.result.split("\n");
        let positionFound = false;
        let ra = "";
        let dec = "";

        for (const line of lines) {
          if (line.startsWith("$$SOE")) {
            positionFound = true; // Start reading after SOE
            continue;
          }
          if (positionFound && line.startsWith("$$EOE")) {
            break; // Stop reading after EOE
          }
          if (positionFound && line.trim() !== "") {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
              ra = `${parts[1]} ${parts[2]} ${parts[3]}`; // RA
              dec = parts[4]; // Dec
              console.log(`Position for ${planet.name}: RA=${ra}, Dec=${dec}`);
              break; // Exit once we have the first position
            }
          }
        }

        if (ra && dec) {
          const distance = planet.distance; // Use the planet's distance
          const cartesianCoords = convertStringToCartesian(ra, dec, distance);

          // Update planet position
          if (!isNaN(cartesianCoords.x) && !isNaN(cartesianCoords.y) && !isNaN(cartesianCoords.z)) {
            planet.object.position.set(cartesianCoords.x, cartesianCoords.y, cartesianCoords.z);
            console.log(`Updated coordinates for ${planet.name}: x=${cartesianCoords.x.toFixed(2)}, y=${cartesianCoords.y.toFixed(2)}, z=${cartesianCoords.z.toFixed(2)}`);

            // Store updated position for orbit rotation later
            updatedPositions.push({ planet, coords: cartesianCoords });

            // Assign or update the orbit
            if (!planet.orbit) {
              // Create orbit if it doesn't exist
              const orbitGeometry = new THREE.CircleGeometry(distance, 64); // Radius set to planet's distance
              const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
              const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
              orbit.rotation.x = Math.PI / 2; // Align with the XY plane
              planet.orbit = orbit;
              scene.add(orbit); // Add the orbit to the scene
            }
          } else {
            console.error(`Invalid coordinates for ${planet.name}: x=${cartesianCoords.x}, y=${cartesianCoords.y}, z=${cartesianCoords.z}`);
          }
        } else {
          console.error(`No position data found for ${planet.name}`);
        }
      } else {
        console.error(`Invalid response format for ${planet.name}`);
      }
    } catch (error) {
      console.error(`Error fetching data for ${planet.name}:`, error);
    }
  }

  // After all planets have been updated, adjust orbits
  for (const { planet, coords } of updatedPositions) {
    // Rotate the orbit based on the planet's position (to match Z-axis)
    const angle = Math.atan2(coords.y, coords.x); // Calculate angle based on planet's position
    planet.orbit.rotation.y = angle; // Rotate the orbit around the Z-axis

    // Keep the orbit centered at (0, 0, 0)
    planet.orbit.position.set(0, 0, 0);
  }
}


// Animate and render the scene
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}


let dateTag = document.getElementById("date");
dateTag.addEventListener("change", function () {
  stateDate = new Date(dateTag.value);
  updatePlanetPositions();
});

// get all checkboxes
let checkboxes = document.querySelectorAll("input[type=checkbox]");
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    if (checkbox.checked) {
      scene.add(planetObjects.find((p) => p.name === checkbox.value).object);
    } else {
      scene.remove(planetObjects.find((p) => p.name === checkbox.value).object);
    }
  });
});

animate();
updatePlanetPositions(); // Initial call to update positions
setInterval(updatePlanetPositions, 86400000); // Update every 24 hours
