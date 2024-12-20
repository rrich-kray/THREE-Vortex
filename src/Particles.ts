import * as THREE from 'three';
import { ParticleHelpers } from './ParticlesHelpers';

export class Particles
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
    const particlesTexture = textureLoader.load('/textures/particles/5.png');
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