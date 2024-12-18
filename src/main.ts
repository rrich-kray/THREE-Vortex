import './style.css';
import * as THREE from 'three';
import * as Types from "./types";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// User can upload an audio file, and some chape will move to the rhythm of the music
// May be getting ahead of myself - first allow a user to choose from several audio files.

/**
 * Setup
 */

// Turn this into a game. Place a character at the center of the tube,
// arrow keys change the y and z, does not move character forward
// Character must avoid objects in path. 
// Could save this idea for an asteroids type game instead, in which a space ship must avoid asteroids
// So could instead add some interactivity to this. a button to change color, a button to set colors to change automatically at intervals, ability to set the interval, etc...
// Or maybe click to change color, or mouseover to change color

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

    this.Tick();
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
    this.Renderer.render(this.Scene, this.Camera);
    window.requestAnimationFrame(this.Tick.bind(this));
  }
}

const setup = new Setup();

class Particles
{
  private Camera: THREE.PerspectiveCamera;
  private Renderer: THREE.WebGLRenderer;
  private ParticleHelpers: ParticleHelpers;
  private ShapeGeometryRotationRate: number;
  private CameraRotationRate: number;

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    particleHelpers: ParticleHelpers,
    shapeGeometryRotationRate: number,
    cameraRotationRate: number)
  {
    this.Camera = camera;
    this.Renderer = renderer;
    this.ParticleHelpers = particleHelpers;
    this.ShapeGeometryRotationRate = shapeGeometryRotationRate;
    this.CameraRotationRate = cameraRotationRate;
  }

  public Generate(): void
  {
    const textureLoader = new THREE.TextureLoader();
    const particlesTexture = textureLoader.load('../static/textures/particles/5.png');
    const particlesBaseColor = new THREE.Color(0.75, 0.5, 0.25);
    const particlesShape = new THREE.TorusGeometry(5, 1, 75, 375);
    const particlesMaterial = new THREE.PointsMaterial({
      sizeAttenuation: true,
      color: "white",
      size: 0.25,
      alphaMap: particlesTexture,
      transparent: false,
      alphaTest: 0.005,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const particles = this.ParticleHelpers.GenerateShape(particlesShape, particlesMaterial, particlesBaseColor);

    this.AdjustCamera();
    this.RenderAnimation(
      particles.geometry,
      particlesShape,
      new Float32Array(particles.geometry.getAttribute('position').array)
    );

    const colors: THREE.Color[] = [
      new THREE.Color().setRGB(0.5, 0.25, 0),
      new THREE.Color().setRGB(0.25, 0.5, 1),
      new THREE.Color().setRGB(0.1, 0.333, 0.22)
    ]

    this.RegisterEventListeners(
      particlesShape,
      new Float32Array(particles.geometry.getAttribute('color').array),
      colors,
      particles.geometry
    )
  }

  private AdjustCamera()
  {
    const cameraVector = new THREE.Vector3(Math.PI * 2.5, 1, 0.5);
    this.Camera.position.z = 0;
    this.Camera.position.y = 5.25;
    this.Camera.lookAt(cameraVector);
  }

  private RenderAnimation(
    particlesGeometry: THREE.BufferGeometry,
    shapeGeometry: THREE.BufferGeometry,
    particlePositions: Float32Array)
  {
    const vertex = new THREE.Vector3;
    this.Renderer.setAnimationLoop(() => 
    {
      shapeGeometry.rotateZ(this.ShapeGeometryRotationRate);
      this.Camera.rotateZ(this.CameraRotationRate);

      const newTorusPositions = shapeGeometry.getAttribute('position');

      let j = 0;
      for (let i=0; i<=particlePositions.length-1; i+=3)
      {
        vertex.fromBufferAttribute(newTorusPositions, j);
        particlePositions[i] = vertex.x;
        particlePositions[i+1] = vertex.y;
        particlePositions[i+2] = vertex.z;

        j++;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    });
  }

  private SetParticleColorsWithDelay = (
    colorIndex: number,
    particlesColors: Float32Array,
    colors: THREE.Color[],
    particlesGeometry: THREE.BufferGeometry) => 
  {
    let delay: number = 0;
    for (let i=0; i<=particlesColors.length-1; i+=3)
    {
      setTimeout(() => 
      {
        particlesColors[i] = colors[colorIndex].r;
        particlesColors[i+1] = colors[colorIndex].g;
        particlesColors[i+2] = colors[colorIndex].b;
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
      }, delay);
      delay += 0.025;
    }
  }
  
  // private SetParticlesColorsWithoutDelay = (
  //   colorIndex: number,
  //   particlesColors: Float32Array,
  //   colors: THREE.Color[],
  //   particlesGeometry: THREE.BufferGeometry) => 
  // {
  //   for (let i=0; i<=particlesColors.length-1; i+=3)
  //   { 
  //     particlesColors[i] =  colors[colorIndex].r;
  //     particlesColors[i+1] = colors[colorIndex].g;
  //     particlesColors[i+2] = colors[colorIndex].b;
  //   }
  //   particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
  // }

  private RegisterEventListeners(
    particlesShapeGeometry: THREE.BufferGeometry,
    particlesColors: Float32Array,
    colors: THREE.Color[],
    particlesGeometry: THREE.BufferGeometry
  )
  {
    let intervalId: number;
    let colorIndex = 0;
    const dropdownBtns: NodeListOf<Element> = document.querySelectorAll('.startBtn')!;

    dropdownBtns.forEach(btn => 
    {
        btn.addEventListener("mouseenter", () => 
        {
            (btn as HTMLElement).style.width = "250px";
            if (btn.classList.contains('changeSpeed'))
              (btn as HTMLElement).textContent = "Change Speed!";
            else if (btn.classList.contains('changeColor'))
              (btn as HTMLElement).textContent = "Change Color!";
            else 
            (btn as HTMLElement).textContent = "Alternate Colors!";
        });
        
        btn.addEventListener("mouseleave", () => 
        {
          (btn as HTMLElement).style.width = "75px";
          (btn as HTMLElement).textContent = "";
        });

        btn.addEventListener('click', () => 
        {
            if (btn.classList.contains('changeSpeed'))
            {
              this.ShapeGeometryRotationRate += 0.0025;
              if (this.ShapeGeometryRotationRate > 0.0075)
                this.ShapeGeometryRotationRate = 0.0025;

              particlesShapeGeometry.rotateZ(this.ShapeGeometryRotationRate);

            } else if (btn.classList.contains('changeColor'))
            {
              clearInterval(intervalId);
              colorIndex++;
              if (colorIndex > colors.length-1) colorIndex = 0;
              this.SetParticleColorsWithDelay(colorIndex, particlesColors, colors, particlesGeometry);
            } else 
            {
              clearInterval(intervalId)
              intervalId = setInterval(() => 
              {
                this.SetParticleColorsWithDelay(colorIndex, particlesColors, colors, particlesGeometry);
                //setParticlesColorsWithoutDelay(colorIndex);
                colorIndex++; 
                if (colorIndex > colors.length-1) colorIndex = 0;
              }, 750);
            }
        });
    });
  }
};

class ParticleHelpers
{
  private Scene: THREE.Scene;

  constructor(scene: THREE.Scene)
  {
    this.Scene = scene;
  }

  public GenerateShape(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    color: THREE.Color): THREE.Points
  {
    const geometryVertexPositions = geometry.getAttribute('position');
    const particleCount: number = geometryVertexPositions.count*3;
    const particlePositions: Float32Array = new Float32Array(particleCount);
    const particlesColors: Float32Array = new Float32Array(particleCount);
    const particlesGeometry = new THREE.BufferGeometry();
    const vertex = new THREE.Vector3();

    let j = 0;
    for (let i=0; i<=particleCount; i+=3)
    {
      vertex.fromBufferAttribute(geometryVertexPositions, j);
      particlePositions[i] = vertex.x;
      particlePositions[i+1] = vertex.y;
      particlePositions[i+2] = vertex.z;

      particlesColors[i] = color.r;
      particlesColors[i+1] = color.g;
      particlesColors[i+2] = color.b;

      j++;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));

    const particles = new THREE.Points(particlesGeometry, material);
    this.Scene.add(particles);

    return particles;
  }
}

let shapeGeometryRotationRate = 0.0025;
let cameraRotationRate = 0.0025;

const particlesHelper = new ParticleHelpers(setup.Scene);

new Particles(
  setup.Camera,
  setup.Renderer,
  particlesHelper,
  shapeGeometryRotationRate,
  cameraRotationRate).Generate();


