import './style.css';
import * as THREE from 'three';
import GUI from 'lil-gui';
import * as Types from "./types";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// User can upload an audio file, and some chape will move to the rhythm of the music
// May be getting ahead of myself - first allow a user to choose from several audio files.

/**
 * Setup
 */

class Setup
{
  public Scene: THREE.Scene;
  public Renderer: THREE.WebGLRenderer;
  public Camera: THREE.PerspectiveCamera;
  public Canvas: HTMLCanvasElement;
  private Sizes: Types.sizes;

  constructor()
  {
    this.Scene = new THREE.Scene();
    this.Canvas = document.querySelector('#webgl')!;  
    
    this.Sizes = {
      height: window.innerHeight,
      width: window.innerWidth
    }
    
    this.Camera = this.InitCamera();
    this.Renderer = this.InitRenderer();
  }

  public InitCamera()
  {
    const Camera = new THREE.PerspectiveCamera(75, this.Sizes.width / this.Sizes.height, 0.1, 100);
    Camera.position.z = 5;
    const controls: OrbitControls = new OrbitControls(Camera, this.Canvas);
    controls.enableDamping = true;
    this.Scene.add(Camera);

    window.addEventListener('resize', () =>
    {
        // Update sizes
        this.Sizes.width = window.innerWidth;
        this.Sizes.height = window.innerHeight;
    
        // Update camera
        this.Camera.aspect = this.Sizes.width / this.Sizes.height;
        this.Camera.updateProjectionMatrix();
    });
    return Camera;
  }

  public InitRenderer()
  {
    const Renderer = new THREE.WebGLRenderer({ canvas: this.Canvas });
    Renderer.setSize(this.Sizes.width, this.Sizes.height);
    Renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    window.addEventListener('resize', () =>
    {
        // Update sizes
        this.Sizes.width = window.innerWidth;
        this.Sizes.height = window.innerHeight;
    
        // Update renderer
        this.Renderer.setSize(this.Sizes.width, this.Sizes.height);
        this.Renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    return Renderer;
  }

  public InitTestObject()
  {
      const testCube: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial()
      );

      this.Scene.add(testCube);
  }

  public Tick() {
    setup.Renderer.render(setup.Scene, setup.Camera);
    window.requestAnimationFrame(this.Tick.bind(this));
  }
}

const setup = new Setup();
setup.InitTestObject();

setup.Tick();

class ObjectInitializer
{

  public static Particles(scene: THREE.Scene)
  {
    const textureLoader = new THREE.TextureLoader();
    const particlesTexture = textureLoader.load('../static/textures/particles/2.png');
    const particlesGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    const particleCount: number = 5000;
    const positions: Float32Array = new Float32Array(particleCount*3);
    const colors: Float32Array = new Float32Array(particleCount*3);

    for (let i=0; i<=particleCount; i++)
    {
      positions[i] = (Math.random() - 0.5) * 5;
      colors[i] = Math.floor(Math.random() * (255-1) + 1);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(positions, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.2,
      alphaMap: particlesTexture,
      transparent: true,
      alphaTest: 0.001,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
  }
}



