import * as THREE from 'three';

export class ParticleHelpers
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