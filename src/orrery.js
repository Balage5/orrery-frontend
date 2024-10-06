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


const informations = {
  mercury: {
    name: "Mercury",
    distance: 5,
    radius: 0.383,
    mass: 0.055,
    temperature: 700,
    description: "Mercury is the smallest planet in the Solar System and the closest to the Sun.",
  },
  venus: {
    name: "Venus",
    distance: 7,
    radius: 0.949,
    mass: 0.815,
    temperature: 465,
    description: "Venus is the second planet from the Sun. It is named after the Roman goddess of love and beauty.",
  },
  earth: {
    name: "Earth",
    distance: 10,
    radius: 1,
    mass: 1,
    temperature: 288,
    description: "Earth is the third planet from the Sun and the only astronomical object known to harbor life.",
  },
  mars: {
    name: "Mars",
    distance: 15,
    radius: 0.532,
    mass: 0.107,
    temperature: 210,
    description: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System.",
  },
  jupiter: {
    name: "Jupiter",
    distance: 52,
    radius: 11.21,
    mass: 317.8,
    temperature: 165,
    description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System.",
  },
  saturn: {
    name: "Saturn",
    distance: 95,
    radius: 9.45,
    mass: 95.2,
    temperature: 134,
    description: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System.",
  },
  uranus: {
    name: "Uranus",
    distance: 192,
    radius: 4,
    mass: 14.5,
    temperature: 76,
    description: "Uranus is the seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System.",
  },
  neptune: {
    name: "Neptune",
    distance: 301,
    radius: 3.88,
    mass: 17.1,
    temperature: 72,
    description: "Neptune is the eighth and farthest known Solar planet from the Sun.",
  },
};



// Add orbit controls for camera movement
const controls = new OrbitControls(camera, renderer.domElement);

// Create and add a bright point light at the center of the solar system
const pointLight = new THREE.PointLight(0xffffff, 4000 * 5, 4000 * 5);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Add a raycaster and a mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const highlightedPlanets = new Set(); // To keep track of highlighted planets

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


let info = document.getElementById("info");

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planetObjects.map(p => p.object));

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    const planetData = planetObjects.find(p => p.object === planet);
    const orbitLine = planetData.orbit;

    // Highlight or unhighlight the orbit line and planet border on click
    if (highlightedPlanets.has(planetData.name)) {
      orbitLine.material.color.set(0xffffff); // Reset to original color
      orbitLine.material.emissive.set(0x000000); // Reset to original emissive
      orbitLine.material.emissiveIntensity = 0; // Reset emissive intensity

      planet.material.emissive.set(0x000000); // Reset planet emissive color
      planet.material.emissiveIntensity = 0; // Reset planet emissive intensity

      highlightedPlanets.delete(planetData.name);
      info.innerHTML = `<p>Click on a planet to get more information</p>`; // Clear the info panel
    } else {
      orbitLine.material.color.set(0xff0000); // Change to red (highlight color)
      orbitLine.material.emissive.set(0xff0000); // Change to red (highlight color)
      orbitLine.material.emissiveIntensity = 1; // Set emissive intensity

      planet.material.emissive.set(0xff0000); // Change planet emissive color to red
      planet.material.emissiveIntensity = 1; // Set planet emissive intensity

      highlightedPlanets.add(planetData.name);
      info.innerHTML = `<h2>${informations[planetData.name.toLowerCase()].name}</h2>
      <p><strong>Distance from Sun:</strong> ${informations[planetData.name.toLowerCase()].distance} AU</p>
      <p><strong>Radius:</strong> ${informations[planetData.name.toLowerCase()].radius} Earths</p>
      <p><strong>Mass:</strong> ${informations[planetData.name.toLowerCase()].mass} Earths</p>
      <p><strong>Temperature:</strong> ${informations[planetData.name.toLowerCase()].temperature} K</p>
      <p><strong>Description:</strong> ${informations[planetData.name.toLowerCase()].description}</p>`;
    }

  }
}

window.addEventListener("click", onMouseClick, false);

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
  // TEST: const givenDate = new Date("2021-05-01").toISOString().split("T")[0];
  // console.log(`Given date: ${givenDate}`);

  // Store updated planet positions temporarily
  const updatedPositions = [];

  for (const planet of planetObjects) {
    const apiUrl = `http://192.168.43.213:3001/planet-data?command=${planet.apiName}&date=${stateDate.toISOString().split("T")[0]}`;
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
dateTag.value = stateDate.toISOString().split("T")[0];
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

// when i press v key toggle over different povs
document.addEventListener("keydown", function (event) {
  if (event.key === "v") {
    // add different camera angles: top down, side view, front view. choose random
    let randomAngle = Math.floor(Math.random() * 3);
    if (randomAngle === 0) {
      camera.position.set(0, 0, 100);
      camera.lookAt(0, 0, 0);
    } else if (randomAngle === 1) {
      camera.position.set(100, 0, 0);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 100, 0);
      camera.lookAt(0, 0, 0);
    }
  }
});


animate();
updatePlanetPositions(); // Initial call to update positions
setInterval(updatePlanetPositions, 86400000); // Update every 24 hours
