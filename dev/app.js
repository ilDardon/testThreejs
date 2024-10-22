import * as THREE from '../libs/three125/three.module.js';
import { OrbitControls } from '../libs/three125/OrbitControls.js';
import { Stats } from '../libs/stats.module.js';
import { ARButton } from '../libs/ARButton.js';

import { LoadingBar } from '../testlibs/LoadingBar.js';
import { GLTFLoader } from '../testlibs/GLTFLoader.js';
import { DRACOLoader } from '../testlibs/DRACOLoader.js';

class App{
    constructor(){
        const container = document.createElement( 'div' );
        document.body.appendChild( container );

        this.clock = new THREE.Clock();
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
        this.scene = new THREE.Scene();
        
        // Iluminación
        this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );
        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
        this.scene.add( light );

        // Renderizador
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
	    this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild( this.renderer.domElement );

        // Controles de la cámara
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        // Estadísticas
        this.stats = new Stats();

       
        this.initScene();
        this.setupVR();
        
        window.addEventListener('resize', this.resize.bind(this) );
    }	

    initScene(){
        this.geometries = [
            new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
            new THREE.SphereBufferGeometry(0.1, 64, 64),
            new THREE.ConeBufferGeometry(0.1, 0.06, 64, 64)
        ];
        this.meshes = [];
        
    }
    
    setupVR(){
        this.renderer.xr.enabled = true; 
        
        const self = this;
        let controller;
        
        function onSelect() {
            const material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random(), shininess: 0.7 } );
            const randomGeometry = self.geometries[Math.floor(Math.random() * self.geometries.length)];
            const mesh = new THREE.Mesh(randomGeometry, material);
            mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
            mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
            self.scene.add(mesh);
            self.meshes.push(mesh);

	    this.loadingBar = new LoadingBar();
	    this.loadGLTF();
        }

        const btn = new ARButton( this.renderer );
        console.log(btn);
        
        controller = this.renderer.xr.getController( 0 );
        controller.addEventListener( 'select', onSelect );
        this.scene.add( controller );

        this.renderer.setAnimationLoop( this.render.bind(this) );
    }

    loadGLTF(){
        const loader = new GLTFLoader().setPath('../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../testlibs/draco/' );
        loader.setDRACOLoader( dracoLoader );

        // Cargar el caballero
        loader.load(
            'knight.glb',
            gltf => {
                this.knight = gltf.scene;
                this.knight.position.set(0, 0, -0.5); // Posicionar el caballero al frente en AR
                this.scene.add(this.knight);
            },
            xhr => {
		this.loadingBar.progress = (xhr.loaded / xhr.total);
			},
            err => {
                console.error(err);
            }
        );
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }

    render(){
        this.stats.update();
        this.meshes.forEach((mesh) => { mesh.rotateY(0.01); });
        this.renderer.render(this.scene, this.camera);
    }
}

export { App };
