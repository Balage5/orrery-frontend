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

// Add orbit controls for camera movement
const controls = new OrbitControls(camera, renderer.domElement);

// Create and add a bright point light at the center of the solar system
const pointLight = new THREE.PointLight(0xffffff, 4000 * 4, 4000 * 4);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Helper function to create a planet
function createPlanet(radius, texture, position) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0,
    roughness: 1,
    emissive: 0x000000,
  });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.set(...position);
  scene.add(planet);
  return planet;
}

// Helper function to create an orbit
function createOrbit(distance) {
  const orbitGeometry = new THREE.CircleGeometry(distance, 64); // Adjust the number of segments for smoother circles
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0xff5454545,
    opacity: 0.5,
    transparent: true,
  });
  const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
  orbitLine.rotation.x = Math.PI / 2; // Rotate the orbit to lie flat on the XY plane
  scene.add(orbitLine);
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
const distanceScale = 50 * factor;
const sunRadius = 69.88 * factor;

for (const planet of planets) {
  planet.distance *= distanceScale;
  createOrbit(planet.distance); // Create orbits for each planet
}

// Load textures and create planets
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

  return {
    ...planet,
    object: createPlanet(planet.radius, texture, [planet.distance, 0, 0]),
  };
});

// Create the Sun
const sunTexture = textureLoader.load(
  "/textures/2k_sun.jpg",
  (texture) => {
    console.log("Sun texture loaded successfully");
  },
  undefined,
  (error) => {
    console.error("Error loading texture for Sun:", error);
  }
);

// Create the Sun mesh with emissive material

const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
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

async function updatePlanetPositions() {
  const currentDate = new Date().toISOString().split("T")[0];

  for (const planet of planetObjects) {
    const apiUrl = `http://localhost:3000/planet-data?command=${planet.apiName}&date=${currentDate}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(
          `Error fetching data for ${planet.name}:`,
          response.statusText
        );
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
              ra = parts[1] + " " + parts[2] + " " + parts[3]; // RA
              dec = parts[4]; // Dec
              console.log(`Position for ${planet.name}: RA=${ra}, Dec=${dec}`);
              break; // Exit once we have the first position
            }
          }
        }

        if (ra && dec) {
          const distance = planet.distance; // Use the planet's distance
          const cartesianCoords = convertToCartesian(ra, dec, distance);

          if (
            !isNaN(cartesianCoords.x) &&
            !isNaN(cartesianCoords.y) &&
            !isNaN(cartesianCoords.z)
          ) {
            planet.object.position.set(
              cartesianCoords.x,
              cartesianCoords.y,
              cartesianCoords.z
            );
            console.log(
              `Updated coordinates for ${
                planet.name
              }: x=${cartesianCoords.x.toFixed(
                2
              )}, y=${cartesianCoords.y.toFixed(
                2
              )}, z=${cartesianCoords.z.toFixed(2)}`
            );
          } else {
            console.error(
              `Invalid coordinates for ${planet.name}: x=${cartesianCoords.x}, y=${cartesianCoords.y}, z=${cartesianCoords.z}`
            );
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
}

function convertToCartesian(ra, dec, distance) {
  const raParts = ra.split(" ");
  const decParts = dec.split(" ");

  if (raParts.length < 3 || decParts.length < 3) {
    console.error(`Invalid RA or Dec format: RA=${ra}, Dec=${dec}`);
    return { x: NaN, y: NaN, z: NaN };
  }

  const hours =
    parseFloat(raParts[0]) +
    parseFloat(raParts[1]) / 60 +
    parseFloat(raParts[2]) / 3600;
  const raRadians = (hours * 15 * Math.PI) / 180;

  const degrees =
    parseFloat(decParts[0]) +
    parseFloat(decParts[1]) / 60 +
    parseFloat(decParts[2]) / 3600;
  const decRadians = (degrees * Math.PI) / 180;

  const x = distance * Math.cos(decRadians) * Math.cos(raRadians);
  const y = distance * Math.cos(decRadians) * Math.sin(raRadians);
  const z = distance * Math.sin(decRadians);

  return { x, y, z };
}

// Setup checkboxes for planet visibility
const checkboxes = document.querySelectorAll("input[type=checkbox]");

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", (event) => {
    const planetName = event.target.value;
    console.log(
      `Checkbox for ${planetName} is ${
        event.target.checked ? "checked" : "unchecked"
      }`
    );
    if (event.target.checked) {
      addPlanets(planetName);
    } else {
      removePlanets(planetName);
    }
  });
});

function addPlanets(planetName) {
  planetObjects.forEach((planet) => {
    if (planet.name === planetName) {
      scene.add(planet.object);
    }
  });
}

function removePlanets(planetName) {
  planetObjects.forEach((planet) => {
    if (planet.name === planetName) {
      scene.remove(planet.object);
    }
  });
}

let speedSlider = document.getElementById("speed");

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  sunLight.position.copy(sun.position);

  planetObjects.forEach((planet, index) => {
    const speed = speedSlider.value / 100000; // Adjust speed as needed
    const angle = Date.now() * speed * (index + 1);
    planet.object.position.x = planet.distance * Math.cos(angle);
    planet.object.position.z = planet.distance * Math.sin(angle);
  });

  renderer.render(scene, camera);
}

// Initialize and start the animation
updatePlanetPositions().then(() => {
  animate();
});

// Define camera positions for flipping through views
const cameraPositions = [
  {
    position: new THREE.Vector3(0, 0, 100),
    lookAt: new THREE.Vector3(0, 0, 0),
  }, // Default view
  {
    position: new THREE.Vector3(100, 0, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
  }, // Right view
  {
    position: new THREE.Vector3(0, 100, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
  }, // Top view
  {
    position: new THREE.Vector3(-100, 0, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
  }, // Left view
  {
    position: new THREE.Vector3(0, -100, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
  }, // Bottom view
];

// Current view index
let currentViewIndex = 0;

// Function to switch the camera view
function switchView() {
  currentViewIndex = (currentViewIndex + 1) % cameraPositions.length; // Loop through views
  const { position, lookAt } = cameraPositions[currentViewIndex];

  // Update camera position and look at target
  camera.position.copy(position);
  camera.lookAt(lookAt);
}

// Add event listener for keydown event
window.addEventListener("keydown", (event) => {
  if (event.key === "v") {
    // Press 'v' to switch views
    switchView();
  }
});

// Set up the scene, camera, and renderer
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize and start the animation loop
updatePlanetPositions();
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
