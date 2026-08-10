import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#space-scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02030a, 0.035);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 0, 14);

const pointer = new THREE.Vector2();
const targetCamera = new THREE.Vector3(0, 0, 14);
let scrollDepth = 0;

function makeCircleTexture(color) {
  const size = 128;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.25, color.replace("1)", "0.52)"));
  gradient.addColorStop(1, color.replace("1)", "0)"));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(textureCanvas);
}

const starTexture = makeCircleTexture("rgba(255,255,255,1)");
const violetTexture = makeCircleTexture("rgba(178,60,255,1)");
const blueTexture = makeCircleTexture("rgba(5,141,255,1)");

function createStars(count, radius, size, texture, color) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorObj = new THREE.Color(color);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * radius;
    positions[i3 + 1] = (Math.random() - 0.5) * radius;
    positions[i3 + 2] = (Math.random() - 0.5) * radius - 18;

    const pulse = 0.62 + Math.random() * 0.38;
    colors[i3] = colorObj.r * pulse;
    colors[i3 + 1] = colorObj.g * pulse;
    colors[i3 + 2] = colorObj.b * pulse;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    map: texture,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

const starField = createStars(1600, 62, 0.09, starTexture, "#ffffff");
const violetDust = createStars(520, 38, 0.22, violetTexture, "#b23cff");
const blueDust = createStars(520, 38, 0.22, blueTexture, "#058dff");
violetDust.position.x = -8;
blueDust.position.x = 8;

function createRibbon(color, xOffset, yOffset, phase) {
  const points = [];
  for (let i = 0; i < 180; i += 1) {
    const t = i / 179;
    const x = (t - 0.5) * 30 + xOffset;
    const y = Math.sin(t * Math.PI * 4 + phase) * 1.25 + yOffset;
    const z = -16 - t * 22 + Math.cos(t * Math.PI * 3 + phase) * 1.8;
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 220, 0.035, 8, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

const violetRibbon = createRibbon(0xb23cff, -7, -2.5, 0.3);
const blueRibbon = createRibbon(0x058dff, 7, -3.8, 1.6);

const flareLight = new THREE.PointLight(0x6fb6ff, 2.4, 30);
flareLight.position.set(0, 0, 4);
scene.add(flareLight);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
}

function updateScrollDepth() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  scrollDepth = window.scrollY / maxScroll;
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("scroll", updateScrollDepth, { passive: true });
resize();
updateScrollDepth();

const intro = document.querySelector("#intro");
const enterSite = document.querySelector("#enterSite");

function hideIntro() {
  if (!intro) return;
  intro.classList.add("is-hidden");
  localStorage.setItem("lumenNoirIntroSeen", "true");
}

if (intro && localStorage.getItem("lumenNoirIntroSeen") === "true") {
  intro.classList.add("is-hidden");
}

enterSite?.addEventListener("click", hideIntro);

const navToggle = document.querySelector("#navToggle");
const siteNav = document.querySelector("#siteNav");

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

const previewModal = document.querySelector("#previewModal");
const previewImage = document.querySelector("#previewImage");
const previewTitle = document.querySelector("#previewTitle");
const previewCategory = document.querySelector("#previewCategory");
const previewDescription = document.querySelector("#previewDescription");
const previewClose = document.querySelector("#previewClose");
let activePreviewCard = null;

function openPreview(card) {
  if (!previewModal || !previewImage || !previewTitle || !previewCategory || !previewDescription) return;

  const image = card.querySelector("img");
  const title = card.querySelector("h2");
  const category = card.querySelector("span");
  const description = card.querySelector("p");

  if (!image || !title || !category || !description) return;

  activePreviewCard = card;
  previewImage.src = image.currentSrc || image.src;
  previewImage.alt = image.alt;
  previewCategory.textContent = category.textContent;
  previewTitle.textContent = title.textContent;
  previewDescription.textContent = description.textContent;
  previewModal.classList.add("is-open");
  previewModal.setAttribute("aria-hidden", "false");
  previewClose?.focus();
}

function closePreview() {
  if (!previewModal || !previewImage) return;

  previewModal.classList.remove("is-open");
  previewModal.setAttribute("aria-hidden", "true");
  previewImage.removeAttribute("src");
  activePreviewCard?.focus();
  activePreviewCard = null;
}

document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("click", () => openPreview(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreview(card);
    }
  });
});

previewClose?.addEventListener("click", closePreview);
previewModal?.addEventListener("click", (event) => {
  if (event.target === previewModal) closePreview();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && previewModal?.classList.contains("is-open")) {
    closePreview();
  }
});

document.querySelectorAll(".project-card img, #previewImage").forEach((image) => {
  image.addEventListener("contextmenu", (event) => event.preventDefault());
  image.addEventListener("dragstart", (event) => event.preventDefault());
});

const briefForm = document.querySelector("#briefForm");

function normalizeHandle(handle) {
  return handle.trim().replace(/^@/, "");
}

function buildBriefMessage(data) {
  return `Brief from ${data.name}%0A%0A` +
    `Preferred contact method: ${data.contactMethod}%0A` +
    `Contact details: ${data.contact}%0A%0A` +
    `Project type: ${data.projectType}%0A` +
    `Deadline: ${data.deadline || "Not specified"}%0A` +
    `Budget range: ${data.budget || "Not specified"}%0A%0A` +
    `Project message:%0A${data.message}`;
}

function openContactChannel(method, details, message) {
  switch (method) {
    case "WhatsApp": {
      const phone = "2349049720587";
      const url = `https://wa.me/${phone}?text=${message}`;
      window.open(url, "_blank");
      break;
    }
    case "Email": {
      const email = "lumennoir.designs@gmail.com";
      const subject = encodeURIComponent("New design brief submission");
      const body = decodeURIComponent(message).replace(/%0A/g, "\n");
      window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`;
      break;
    }
    case "Instagram": {
      const handle = normalizeHandle(details) || "lumennoir_designs";
      const url = `https://www.instagram.com/direct/new/?username=${encodeURIComponent(handle)}`;
      window.open(url, "_blank");
      break;
    }
    case "Telegram": {
      const number = normalizeHandle(details).replace(/^\+?0?/, "");
      const url = `https://t.me/+${encodeURIComponent(number)}`;
      window.open(url, "_blank");
      break;
    }
    default:
      alert("Please select a valid contact method.");
  }
}

briefForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(briefForm);
  const data = {
    name: formData.get("name")?.toString().trim() || "Anonymous",
    contactMethod: formData.get("contactMethod")?.toString().trim() || "",
    contact: formData.get("contact")?.toString().trim() || "",
    projectType: formData.get("projectType")?.toString().trim() || "",
    deadline: formData.get("deadline")?.toString().trim() || "",
    budget: formData.get("budget")?.toString().trim() || "",
    message: formData.get("message")?.toString().trim() || "",
  };

  if (!data.contactMethod || !data.contact) {
    alert("Please select a contact method and provide your contact details.");
    return;
  }

  const briefMessage = buildBriefMessage(data);
  openContactChannel(data.contactMethod, data.contact, briefMessage);
});

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  targetCamera.x = pointer.x * 1.2;
  targetCamera.y = -pointer.y * 0.7;
  targetCamera.z = 14 - scrollDepth * 4;
  camera.position.lerp(targetCamera, 0.045);
  camera.lookAt(0, 0, -12);

  starField.rotation.y = elapsed * 0.014;
  starField.rotation.x = elapsed * 0.006;
  violetDust.rotation.y = elapsed * 0.024;
  blueDust.rotation.y = -elapsed * 0.022;

  violetRibbon.rotation.z = Math.sin(elapsed * 0.3) * 0.06;
  violetRibbon.position.y = Math.sin(elapsed * 0.7) * 0.25;
  blueRibbon.rotation.z = Math.cos(elapsed * 0.32) * 0.06;
  blueRibbon.position.y = Math.cos(elapsed * 0.64) * 0.25;

  flareLight.intensity = 1.7 + Math.sin(elapsed * 1.6) * 0.45;
  flareLight.position.x = Math.sin(elapsed * 0.45) * 4;
  flareLight.position.y = Math.cos(elapsed * 0.35) * 2;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
