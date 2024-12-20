import * as THREE from 'three';
import * as Types from './types'
import { OrbitControls } from 'three/examples/jsm/Addons.js';

interface ThreeSetup
{
    Scene: THREE.Scene;
    Renderer: THREE.Renderer;
    Camera: THREE.PerspectiveCamera;
    Canvas: HTMLCanvasElement;
    InitCamera: () => THREE.PerspectiveCamera;
    InitRenderer: () => THREE.WebGLRenderer;
    InitLight: () => THREE.Light;
    Tick: () => void;
}

export class Setup implements ThreeSetup
{
  public Scene: THREE.Scene;
  public Renderer: THREE.WebGLRenderer;
  public Camera: THREE.PerspectiveCamera;
  public Light: THREE.Light;
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
    this.Light = this.InitLight();

    this.Tick();
  }

  public InitCamera(): THREE.PerspectiveCamera
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

  public InitRenderer(): THREE.WebGLRenderer
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

  public InitLight(): THREE.Light
  {
    const ambientLight = new THREE.AmbientLight(0xffffff, 5);
    ambientLight.position.set(0, 0, 0);
    this.Scene.add(ambientLight);
    return ambientLight;
  }

  public InitTestObject(): void
  {
      const testCube: THREE.Mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial()
      );

      this.Scene.add(testCube);
  }

  public Tick(): void
  {
    this.Renderer.render(this.Scene, this.Camera);
    window.requestAnimationFrame(this.Tick.bind(this));
  }
}