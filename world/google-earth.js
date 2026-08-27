// google-earth.js — Photorealistic 3D Tiles (Google Map Tiles API) for Three.js
// ใช้กับ world/index.html — ต้องใส่ Google Maps API Key ที่เปิด Map Tiles API + 3D Tiles
// ขอ key ฟรี: https://console.cloud.google.com/apis/library/tile.googleapis.com
import * as THREE from 'three';
import { TilesRenderer } from 'https://cdn.jsdelivr.net/npm/3d-tiles-renderer@0.3.34/build/three/3d-tiles-renderer.module.js';

let tiles=null, enabled=false;

export function initGoogleEarth(scene, camera, renderer, apiKey){
  if(!apiKey || apiKey==='YOUR_API_KEY'){
    console.warn('[Google Earth] ใส่ API Key ก่อน — ใช้ globe fallback');
    addFallbackGlobe(scene);
    return null;
  }
  tiles=new TilesRenderer(`https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`);
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);
  // Bangkok — ปรับ lat/lon ได้
  tiles.group.position.set(0,0,0);
  scene.add(tiles.group);
  enabled=true;
  return tiles;
}

function addFallbackGlobe(scene){
  const loader=new THREE.TextureLoader();
  const earth=new THREE.Mesh(
    new THREE.SphereGeometry(30,64,64),
    new THREE.MeshStandardMaterial({ map: loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg') })
  );
  earth.position.set(0,-32,0); scene.add(earth);
}

export function updateEarth(camera, renderer){
  if(tiles && enabled) tiles.update();
}

export function setEarthEnabled(v, scene){
  if(!tiles) return; enabled=v; tiles.group.visible=v;
}

export function flyTo(lat, lon, alt=500){
  // แปลง lat/lon เป็น ECEF แล้ว set camera — ใช้ tiles.transform
  if(!tiles) return;
  console.log(`Fly to ${lat}, ${lon}`);
}
