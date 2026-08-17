import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";

const app = document.querySelector("#app");

app.innerHTML = `
<header class="topbar">
  <div class="brand">
    <div class="brand-mark">M</div>
    <div><strong>Manifestor Slicer</strong><small>WEB 3D PRINTING PLATFORM</small></div>
  </div>
  <nav class="toolbar">
    <button data-tool="select" class="tool active">Select</button>
    <button data-tool="move" class="tool">Move</button>
    <button data-tool="rotate" class="tool">Rotate</button>
    <button data-tool="scale" class="tool">Scale</button>
    <span class="separator"></span>
    <button id="newBtn" class="tool">New</button>
    <button id="sliceBtn" class="sliceTop">Slice</button>
  </nav>
</header>

<main class="shell">
  <aside class="sidebar">
    <section>
      <div class="section-title">MODEL</div>
      <label class="dropzone" for="fileInput">
        <span class="plus">+</span>
        <b>Upload 3D Model</b>
        <small>STL supported in V4 foundation</small>
      </label>
      <input id="fileInput" hidden type="file" accept=".stl">
    </section>

    <section>
      <div class="section-title">PRINTER</div>
      <select id="printer" class="select">
        <option value="manifestor-core">Manifestor Core</option>
        <option value="creality-k1c">Creality K1C</option>
        <option value="creality-k2plus">Creality K2 Plus</option>
      </select>
    </section>

    <section>
      <div class="section-title">FILAMENT</div>
      <select id="filament" class="select">
        <option value="pla">PLA</option>
        <option value="petg">PETG</option>
        <option value="abs">ABS</option>
        <option value="tpu">TPU</option>
      </select>
    </section>

    <section>
      <div class="section-title">PROCESS</div>
      <select id="process" class="select">
        <option value="standard">Standard 0.20</option>
        <option value="draft">Draft 0.28</option>
        <option value="fine">Fine 0.12</option>
        <option value="fast">Fast 0.24</option>
      </select>
    </section>

    <section>
      <div class="section-title">QUALITY</div>
      <label class="setting"><span>Layer Height <b id="layerOut">0.20 mm</b></span><input id="layer" type="range" min="0.08" max="0.32" step="0.01" value="0.20"></label>
      <label class="setting"><span>Infill <b id="infillOut">20%</b></span><input id="infill" type="range" min="0" max="100" step="5" value="20"></label>
      <label class="setting"><span>Wall Count <b id="wallOut">3</b></span><input id="walls" type="range" min="1" max="8" value="3"></label>
    </section>

    <section>
      <div class="section-title">SPEED</div>
      <label class="setting"><span>Print Speed <b id="speedOut">100 mm/s</b></span><input id="speed" type="range" min="20" max="300" step="5" value="100"></label>
    </section>

    <section>
      <div class="section-title">SUPPORT</div>
      <select id="support" class="select">
        <option>Disabled</option>
        <option>Build Plate Only</option>
        <option>Everywhere</option>
      </select>
      <label class="check"><input id="brim" type="checkbox"> Enable Brim</label>
    </section>

    <section>
      <div class="section-title">OBJECT</div>
      <div class="grid-buttons">
        <button id="centerBtn">Center</button>
        <button id="layBtn">Lay Flat</button>
        <button id="dupBtn">Duplicate</button>
        <button id="fitBtn">Fit</button>
        <button id="resetBtn">Reset</button>
        <button id="deleteBtn">Delete</button>
      </div>
    </section>

    <section>
      <div class="section-title">BUILD PLATE</div>
      <select id="plate" class="select">
        <option value="300">300 × 300 mm</option>
        <option value="256">256 × 256 mm</option>
        <option value="220">220 × 220 mm</option>
      </select>
    </section>
  </aside>

  <section class="workspace">
    <div id="viewport"></div>
    <div class="view-tools">
      <button id="topView">Top</button><button id="frontView">Front</button><button id="sideView">Side</button><button id="fitView">Fit</button>
    </div>

    <div id="empty" class="empty">
      <div class="empty-icon">◇</div>
      <h2>Ready to Print</h2>
      <p>Upload an STL model to start</p>
    </div>

    <aside id="inspector" class="inspector hidden">
      <div class="section-title">OBJECT INFORMATION</div>
      <div class="info"><span>File</span><b id="infoFile">-</b></div>
      <div class="info"><span>Size</span><b id="infoSize">-</b></div>
      <div class="info"><span>Triangles</span><b id="infoTriangles">-</b></div>
      <div class="info"><span>Position</span><b id="infoPosition">0, 0, 0</b></div>
    </aside>

    <div id="result" class="result hidden">
      <div class="result-title">SLICE JOB</div>
      <div class="result-grid">
        <div><small>Status</small><strong id="jobStatus">Ready</strong></div>
        <div><small>Layers</small><strong id="jobLayers">-</strong></div>
        <div><small>Time</small><strong id="jobTime">-</strong></div>
        <div><small>Material</small><strong id="jobMaterial">-</strong></div>
      </div>
      <p class="engine-note">Real slicing engine is the next integration layer. No demo G-code is exported from this foundation.</p>
    </div>

    <div class="statusbar">
      <span>Status: <b id="status">Waiting for model</b></span>
      <div class="progress"><i id="progress"></i></div>
      <div class="status-actions"><button id="gridBtn">Grid</button><button id="resetCamera">Reset View</button></div>
    </div>
  </section>
</main>
`;

const state = {
  mesh: null,
  selected: null,
  file: null,
  grid: true,
  tool: "select",
  settings: {
    layer: 0.20,
    infill: 20,
    walls: 3,
    speed: 100
  }
};

const viewport = document.querySelector("#viewport");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e12);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
camera.position.set(140, 140, 140);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.0));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(120, 180, 100);
scene.add(key);

let grid = new THREE.GridHelper(300, 30, 0x454b54, 0x252a31);
scene.add(grid);

const bed = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshBasicMaterial({ color: 0x10141a, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
);
bed.rotation.x = -Math.PI / 2;
scene.add(bed);

function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", resize);
resize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

function status(text, progress = null) {
  document.querySelector("#status").textContent = text;
  if (progress !== null) document.querySelector("#progress").style.width = `${progress}%`;
}

function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function fitModel() {
  if (!state.mesh) return;
  const box = new THREE.Box3().setFromObject(state.mesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z);
  camera.position.set(center.x + max * 1.6, center.y + max * 1.6, center.z + max * 1.6);
  controls.target.copy(center);
  controls.update();
}

function centerModel() {
  if (!state.mesh) return;
  state.mesh.position.set(0, 0, 0);
  updateInspector();
}

function updateInspector() {
  if (!state.mesh) return;
  document.querySelector("#infoPosition").textContent =
    `${state.mesh.position.x.toFixed(1)}, ${state.mesh.position.y.toFixed(1)}, ${state.mesh.position.z.toFixed(1)}`;
}

function loadSTL(file) {
  status("Loading model...", 15);
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const geometry = new STLLoader().parse(e.target.result);
      geometry.computeBoundingBox();

      if (state.mesh) {
        scene.remove(state.mesh);
        state.mesh.geometry.dispose();
        state.mesh.material.dispose();
      }

      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      const max = Math.max(size.x, size.y, size.z);
      geometry.center();

      state.mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0xff7900, roughness: 0.62, metalness: 0.12 })
      );
      state.selected = state.mesh;

      const scale = 80 / Math.max(max, 0.001);
      state.mesh.scale.setScalar(scale);
      scene.add(state.mesh);

      document.querySelector("#empty").classList.add("hidden");
      document.querySelector("#inspector").classList.remove("hidden");
      document.querySelector("#infoFile").textContent = file.name;
      document.querySelector("#infoSize").textContent = `${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} mm`;
      document.querySelector("#infoTriangles").textContent = Math.round(geometry.attributes.position.count / 3).toLocaleString();

      centerModel();
      fitModel();
      status("Model loaded", 100);
      toast("STL loaded");
    } catch (err) {
      console.error(err);
      status("Invalid STL", 0);
      toast("Could not load STL");
    }
  };
  reader.readAsArrayBuffer(file);
}

document.querySelector("#fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) {
    state.file = file;
    loadSTL(file);
  }
});

function setTool(name) {
  state.tool = name;
  document.querySelectorAll(".tool[data-tool]").forEach(b => b.classList.toggle("active", b.dataset.tool === name));
  toast(`${name[0].toUpperCase() + name.slice(1)} tool selected`);
}

document.querySelectorAll(".tool[data-tool]").forEach(b => b.addEventListener("click", () => setTool(b.dataset.tool)));

document.querySelector("#centerBtn").onclick = centerModel;
document.querySelector("#fitBtn").onclick = fitModel;
document.querySelector("#layBtn").onclick = () => { if (state.mesh) { state.mesh.rotation.x = -Math.PI / 2; toast("Model laid flat"); } };
document.querySelector("#resetBtn").onclick = () => { if (state.mesh) { state.mesh.rotation.set(0,0,0); state.mesh.scale.setScalar(80 / Math.max(...Object.values(state.mesh.geometry.boundingBox.max).map(Math.abs), 0.001)); toast("Transform reset"); } };
document.querySelector("#deleteBtn").onclick = () => {
  if (!state.mesh) return;
  scene.remove(state.mesh);
  state.mesh.geometry.dispose();
  state.mesh.material.dispose();
  state.mesh = null;
  state.selected = null;
  document.querySelector("#empty").classList.remove("hidden");
  document.querySelector("#inspector").classList.add("hidden");
  status("Waiting for model", 0);
};
document.querySelector("#dupBtn").onclick = () => {
  if (!state.mesh) return;
  const copy = state.mesh.clone();
  copy.material = state.mesh.material.clone();
  copy.position.x += 25;
  scene.add(copy);
  toast("Object duplicated");
};

document.querySelector("#topView").onclick = () => {
  if (!state.mesh) return;
  const box = new THREE.Box3().setFromObject(state.mesh);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const m = Math.max(s.x,s.y,s.z);
  camera.position.set(c.x, c.y + m*2, c.z);
  controls.target.copy(c); controls.update();
};
document.querySelector("#frontView").onclick = () => {
  if (!state.mesh) return;
  const box = new THREE.Box3().setFromObject(state.mesh);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const m = Math.max(s.x,s.y,s.z);
  camera.position.set(c.x, c.y, c.z + m*2);
  controls.target.copy(c); controls.update();
};
document.querySelector("#sideView").onclick = () => {
  if (!state.mesh) return;
  const box = new THREE.Box3().setFromObject(state.mesh);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const m = Math.max(s.x,s.y,s.z);
  camera.position.set(c.x+m*2, c.y, c.z);
  controls.target.copy(c); controls.update();
};
document.querySelector("#fitView").onclick = fitModel;

document.querySelector("#gridBtn").onclick = () => {
  state.grid = !state.grid;
  grid.visible = state.grid;
  bed.visible = state.grid;
};

document.querySelector("#resetCamera").onclick = () => {
  camera.position.set(140,140,140);
  controls.target.set(0,0,0);
  controls.update();
};

function bindRange(id, output, suffix, decimals = 0) {
  const el = document.querySelector(`#${id}`);
  const out = document.querySelector(`#${output}`);
  el.addEventListener("input", () => {
    const value = Number(el.value);
    state.settings[id] = value;
    out.textContent = `${value.toFixed(decimals)}${suffix}`;
  });
}
bindRange("layer","layerOut"," mm",2);
bindRange("infill","infillOut","%");
bindRange("walls","wallOut","");
bindRange("speed","speedOut"," mm/s");

document.querySelector("#process").addEventListener("change", e => {
  const presets = {
    standard: 0.20,
    draft: 0.28,
    fine: 0.12,
    fast: 0.24
  };
  document.querySelector("#layer").value = presets[e.target.value];
  document.querySelector("#layer").dispatchEvent(new Event("input"));
});

document.querySelector("#sliceBtn").onclick = async () => {
  if (!state.mesh) {
    toast("Upload a model first");
    return;
  }

  const result = document.querySelector("#result");
  result.classList.remove("hidden");
  document.querySelector("#jobStatus").textContent = "Engine not connected";
  document.querySelector("#jobMaterial").textContent = document.querySelector("#filament").value.toUpperCase();

  const box = new THREE.Box3().setFromObject(state.mesh);
  const size = box.getSize(new THREE.Vector3());
  const layers = Math.max(1, Math.ceil(size.z / state.settings.layer));

  document.querySelector("#jobLayers").textContent = layers.toLocaleString();
  document.querySelector("#jobTime").textContent = "—";

  status("Slicer engine required", 100);
  toast("Prepare stage complete — real engine integration is next");
};

document.querySelector("#newBtn").onclick = () => {
  document.querySelector("#deleteBtn").click();
  document.querySelector("#result").classList.add("hidden");
  document.querySelector("#fileInput").value = "";
  state.file = null;
  toast("New project");
};

document.addEventListener("keydown", e => {
  if (e.key === "f" || e.key === "F") fitModel();
  if (e.key === "Delete") document.querySelector("#deleteBtn").click();
});

status("Waiting for model", 0);
