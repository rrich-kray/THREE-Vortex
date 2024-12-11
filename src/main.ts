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
//setup.InitTestObject();

setup.Tick();

class ObjectInitializer
{
  private Scene: THREE.Scene;
  private Camera: THREE.PerspectiveCamera;
  private Renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer)
  {
    this.Scene = scene;
    this.Camera = camera;
    this.Renderer = renderer;
  }

  public InstancesWithinTunnel()
  {
    const cubeDimensions = {
      width: 0.5,
      height: 0.5,
      depth: 0.5
    }

    const cubeInstanceCount = 50;
    const cubeInstancedMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 'white' });
    const cubeInstancedGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(cubeDimensions.width, cubeDimensions.height, cubeDimensions.depth);
    const cubeInstancedMesh = new THREE.InstancedMesh(cubeInstancedGeometry, cubeInstancedMaterial, cubeInstanceCount);

    const dummy = new THREE.Object3D();

    for (let i=0; i<=cubeInstanceCount; i++)
    {
      const angle = Math.random() * Math.PI * 6;
      const radius = 3 + Math.random() * 1;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      const z = Math.cos(angle) * radius;

      dummy.position.x = x;
      dummy.position.y = y;
      dummy.position.z = z;
      dummy.updateMatrix();

      cubeInstancedMesh.setMatrixAt(i, dummy.matrix);
    } 
    // cubeInstancedMesh.rotateZ(10);
    this.Scene.add(cubeInstancedMesh);
  }

  public InstanceShape()
  {
    const sphereDimensions = {
      radius: 0.05,
      widthSegments: 8
    }

    const torusGeometry: THREE.TorusGeometry = new THREE.TorusGeometry(5, 1, 50, 300);
    const torusPositions = torusGeometry.getAttribute('position');
    torusGeometry.rotateY(7.85);
    
    this.Camera.position.set(0, 5, 2);
    
    const sphereInstanceCount = torusPositions.count;
    const sphereInstancedMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 'red' });
    const sphereInstancedGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(sphereDimensions.radius, sphereDimensions.widthSegments);
    const sphereInstancedMesh = new THREE.InstancedMesh(sphereInstancedGeometry, sphereInstancedMaterial, sphereInstanceCount);

    const vertex = new THREE.Vector3();
    const object3d = new THREE.Object3D();

    for (let i=0; i<=sphereInstanceCount; i++)
    {
      vertex.fromBufferAttribute(torusPositions, i);
      object3d.position.x = vertex.x;
      object3d.position.y = vertex.y;
      object3d.position.z = vertex.z;
      object3d.updateMatrix();

      sphereInstancedMesh.setMatrixAt(i, object3d.matrix);
    } 
    this.Scene.add(sphereInstancedMesh);

    this.Renderer.setAnimationLoop(() => 
    {
      torusGeometry.rotateZ(0.025);
      this.Camera.rotateZ(0.001);

      const newTorusPositions = torusGeometry.getAttribute('position');

      for (let i=0; i<=sphereInstanceCount-1; i++)
      {
        vertex.fromBufferAttribute(newTorusPositions, i);
        
        object3d.position.x = vertex.x;
        object3d.position.y = vertex.y;
        object3d.position.z = vertex.z;

        object3d.updateMatrix();

        sphereInstancedMesh.setMatrixAt(i, object3d.matrix);
      }
    });

  }

  public ParticleShape()
  {
    const textureLoader = new THREE.TextureLoader();
    const particlesTexture = textureLoader.load('../static/textures/particles/5.png');
    const torusGeometry: THREE.TorusGeometry = new THREE.TorusGeometry(5, 1, 75, 375);
    const particlesGeometry = new THREE.BufferGeometry();
    const torusVertexPositions = torusGeometry.getAttribute('position');
    const particleCount: number = torusVertexPositions.count*3;
    const particlePositions: Float32Array = new Float32Array(particleCount);
    const particlesColors: Float32Array = new Float32Array(particleCount);
    const vertex = new THREE.Vector3();

    let j = 0;
    for (let i=0; i<=particleCount; i+=3)
    {
      vertex.fromBufferAttribute(torusVertexPositions, j);
      particlePositions[i] = vertex.x;
      particlePositions[i+1] = vertex.y;
      particlePositions[i+2] = vertex.z;

      particlesColors[i] = 212;
      particlesColors[i+1] = 70;
      particlesColors[i+2] = 40;

      j++;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      sizeAttenuation: true,
      color: "white",
      size: 0.2,
      alphaMap: particlesTexture,
      transparent: false,
      alphaTest: 0.005,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    this.Camera.position.z = 0;
    this.Camera.position.y = 5.25;
    const cameraVector = new THREE.Vector3(Math.PI * 2.5, 1, 0.5);
    setup.Camera.lookAt(cameraVector);

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.Scene.add(particles);

    this.Renderer.setAnimationLoop(() => 
    {
      torusGeometry.rotateZ(0.0025);
      this.Camera.rotateZ(0.001);

      const newTorusPositions = torusGeometry.getAttribute('position');

      let j = 0;
      for (let i=0; i<=particleCount; i+=3)
      {
        vertex.fromBufferAttribute(newTorusPositions, j);
        particlePositions[i] = vertex.x;
        particlePositions[i+1] = vertex.y;
        particlePositions[i+2] = vertex.z;

        // if (clock.getDelta() % 2 == 0)
        // {
        //   particlesColors[i] = Math.random();
        //   particlesColors[i+1] = Math.random();
        //   particlesColors[i+2] = Math.floor(Math.random() * (255 - 1) + 1);
        // }

        j++;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    });

    const colors: THREE.Color[] = [
      // new THREE.Vector3().set(0, 0, 0),
      new THREE.Color().setRGB(0.5, 0.25, 0),
      new THREE.Color().setRGB(0.25, 0.5, 1),
      new THREE.Color().setRGB(0.1, 0.333, 0.22)
    ]

    const setParticleColorsWithDelay = (colorIndex: number) => 
    {
      let delay: number = 0;
      for (let i=0; i<=particleCount; i+=3)
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

    const setParticlesColorsWithoutDelay = (colorIndex: number) => 
    {
      for (let i=0; i<=particleCount; i+=3)
      { 
        particlesColors[i] =  colors[colorIndex].r;
        particlesColors[i+1] = colors[colorIndex].g;
        particlesColors[i+2] = colors[colorIndex].b;
      }
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
    }

    let colorIndex = 0;
    // setParticleColorsWithDelay(colorIndex);
    setParticlesColorsWithoutDelay(colorIndex);
    setInterval(() => {
      // setParticleColorsWithDelay(colorIndex);
      setParticlesColorsWithoutDelay(colorIndex);
      colorIndex++;
      if (colorIndex > colors.length-1) colorIndex = 0;
    }, 750);
  }
}

const objectInitializer = new ObjectInitializer(setup.Scene, setup.Camera, setup.Renderer); 

objectInitializer.ParticleShape();
//objectInitializer.InstanceShape();



