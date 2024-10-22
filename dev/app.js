import * as THREE from '../libs/three125/three.module.js';
import { OrbitControls } from '../libs/three125/OrbitControls.js';
import { Stats } from '../libs/stats.module.js';
import { ARButton } from '../libs/ARButton.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		
		this.scene = new THREE.Scene();
       
		this.scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
		container.appendChild( this.renderer.domElement );
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        
        this.stats = new Stats();
        
        this.initScene();
        this.setupVR();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	
    
    initScene(){
        this.geometry = new THREE.BoxBufferGeometry( 0.06, 0.06, 0.06 ); 
        this.geometry2 = new THREE.SphereBufferGeometry( 0.5 );
        this.geometry3 = new THREE.ConeBufferGeometry(0.5);
        this.meshes = [];
    }
    
    setupVR(){
        this.renderer.xr.enabled = true; 
        
        const self = this;
        let controller;
        
        function onSelect() {
            const material = new THREE.MeshStandardMaterial( {color: 0xffffff * Math.random(), metalness: 1 } );

            const mesh = [new THREE.Mesh( self.geometry, material ), new THREE.Mesh( self.geometry2, material ), new THREE.Mesh( self.geometry3, material )];
            mesh[0].position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
            mesh[0].quaternion.setFromRotationMatrix( controller.matrixWorld );
            mesh[1].position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
            mesh[1].quaternion.setFromRotationMatrix( controller.matrixWorld );
            mesh[2].position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
            mesh[2].quaternion.setFromRotationMatrix( controller.matrixWorld );
            temporalMesh = mesh[(Math.floor(Math.random() * mesh.length))]
            self.scene.add( temporalMesh );
            self.meshes.push( temporalMesh );

        }

        const btn = new ARButton( this.renderer );
        
        controller = this.renderer.xr.getController( 0 );
        controller.addEventListener( 'select', onSelect );
        this.scene.add( controller );
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.stats.update();
        this.meshes.forEach( (mesh) => { mesh.rotateY( 0.01 ); });
        this.renderer.render( this.scene, this.camera );
    }
}

export { App };
