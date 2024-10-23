import * as THREE from '../libs/three125/three.module.js';
import { ARButton } from '../libs/ARButton.js';
import { LoadingBar } from '../libs/LoadingBar.js';
import { OrbitControls } from '../libs/three125/OrbitControls.js';
import { GLTFLoader } from '../libs/three125/GLTFLoader.js';
import { DRACOLoader } from '../libs/three125/DRACOLoader.js';

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

        window.addEventListener('resize', this.resize.bind(this));
    }

    initScene() {
        this.geometries = [
            new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
            new THREE.SphereBufferGeometry(0.1, 64, 64),
            new THREE.ConeBufferGeometry(0.05, 0.1, 64, 64)
        ];
        this.meshes = [];
    }

    setupVR() {
        this.renderer.xr.enabled = true;

        const self = this;
        let controller;

        function onSelect(event) {
            if (!self.knight) {
                self.loadGLTF();
            } else {
                const material = new THREE.MeshPhongMaterial({ color: 0xffffff * Math.random(), shininess: 0.7 });
                const randomGeometry = self.geometries[Math.floor(Math.random() * self.geometries.length)];
                const mesh = new THREE.Mesh(randomGeometry, material);
                
                // Usar la posición del controlador para colocar la figura
                mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
                mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
                
                self.scene.add(mesh);
                self.meshes.push(mesh);
            }
        }

        const btn = new ARButton(this.renderer, {
            sessionInit: {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.body }
            }
        });
        
        controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', onSelect);
        this.scene.add(controller);

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    loadGLTF() {
        this.loadingBar = new LoadingBar();
        const loader = new GLTFLoader().setPath('../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('../libs/three125/draco/');
        loader.setDRACOLoader(dracoLoader);

        loader.load(
            'knight.glb',
            gltf => {
                console.log('GLTF model loaded successfully');
                this.knight = gltf.scene;
                
                // Ajustar la escala y posición del caballero
                this.knight.scale.set(0.5, 0.5, 0.5);
                this.knight.position.set(0, 0, -1);
                
                this.scene.add(this.knight);
                console.log('Knight added to the scene');

                this.mixer = new THREE.AnimationMixer(this.knight);
                if (gltf.animations && gltf.animations.length > 0) {
                    console.log(`Found ${gltf.animations.length} animations`);
                    const clip = gltf.animations[0];
                    this.action = this.mixer.clipAction(clip);
                    this.action.play();
                } else {
                    console.warn('No animations found in the GLTF file');
                }

                this.loadingBar.visible = false;
            },
            xhr => {
                this.loadingBar.progress = (xhr.loaded / xhr.total);
            },
            err => {
                console.error('An error happened:', err);
            }
        );
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render(timestamp, frame) {
        if (this.renderer.xr.isPresenting) {
            const session = this.renderer.xr.getSession();
            const pose = frame.getViewerPose(session.referenceSpace);
            
            if (pose) {
                const view = pose.views[0];
                const viewport = session.renderState.baseLayer.getViewport(view);
                this.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
                this.camera.matrix.fromArray(view.transform.matrix);
                this.camera.projectionMatrix.fromArray(view.projectionMatrix);
                this.camera.updateMatrixWorld(true);
            }
        }

        this.meshes.forEach((mesh) => { mesh.rotateY(0.01); });
        
        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

export { App };
