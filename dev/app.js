import * as THREE from '../libs/three125/three.module.js';
import { OrbitControls } from '../libs/three125/OrbitControls.js';
import { ARButton } from '../libs/ARButton.js';

import { GLTFLoader } from '../testlibs/GLTFLoader.js';
import { DRACOLoader } from '../testlibs/DRACOLoader.js';

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.clock = new THREE.Clock();

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        
        this.scene = new THREE.Scene();

        this.scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        this.initScene();
        this.setupVR();
        this.loadGLTF();
        
        window.addEventListener('resize', this.resize.bind(this));
    }

    initScene() {
        this.geometries = [
            new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
            new THREE.SphereBufferGeometry(0.1, 64, 64),
            new THREE.ConeBufferGeometry(0.1, 0.06, 64, 64)
        ];
        this.meshes = [];
    }

    setupVR() {
        this.renderer.xr.enabled = true;

        // Crear botón de AR y agregarlo al documento
        const btn = ARButton.createButton(this.renderer);
        document.body.appendChild(btn);
        let controller;

        function onSelect() {
            const material = new THREE.MeshPhongMaterial({ color: 0xffffff * Math.random(), shininess: 0.7 });

            const randomGeometry = self.geometries[Math.floor(Math.random() * self.geometries.length)];
            const mesh = new THREE.Mesh(randomGeometry, material);
            mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
            mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);

            this.scene.add(mesh);
            this.meshes.push(mesh);
        }

        // Configurar el controlador para seleccionar objetos
        controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', onSelect);
        this.scene.add(controller);
        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    loadGLTF() {
        const loader = new GLTFLoader().setPath('../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('../testlibs/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('knight.glb', (gltf) => {
            this.knight = gltf.scene;

            // Configura el modelo para AR
            this.knight.position.set(0, 0, -0.5); // Ajusta la posición del modelo en AR

            this.scene.add(this.knight);

            this.mixer = new THREE.AnimationMixer(this.knight);
            const danceClip = gltf.animations.find(clip => clip.name.toLowerCase() === 'dance');
            if (danceClip) {
                const action = this.mixer.clipAction(danceClip);
                action.play(); // Reproduce la animación 'Dance' automáticamente
            }

        }, undefined, (err) => {
            console.error('Error loading GLTF model', err);
        });
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        const dt = this.clock.getDelta();
        if (this.mixer) this.mixer.update(dt);

        this.meshes.forEach((mesh) => { mesh.rotateY(0.05); });
        this.renderer.render(this.scene, this.camera);
    }
}

export { App };
