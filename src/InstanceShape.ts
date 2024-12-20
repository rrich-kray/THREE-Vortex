import * as THREE from 'three';
import { Setup } from './Setup';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class InstanceShape
{
    private Camera: THREE.PerspectiveCamera;
    private Scene: THREE.Scene;
    private Renderer: THREE.WebGLRenderer;

    constructor(setup: Setup) 
    {
        this.Camera = setup.Camera;
        this.Scene = setup.Scene;
        this.Renderer = setup.Renderer;
    }

    public SetEnvironmentMap()
    {
        const pmremGenerator = new THREE.PMREMGenerator( this.Renderer );
        new RGBELoader().load('../static/textures/wasteland_clouds_puresky_1k.hdr', (texture) => 
        {   
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            texture.dispose();
            this.Scene.environment = envMap;
        });
    }

    public Generate(geometryMold: THREE.BufferGeometry) 
    {
        this.SetEnvironmentMap();
        const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = geometryMold.getAttribute('position');
        const instanceCount: number = positions.count;
        const instanceGeometry: THREE.BufferGeometry = new THREE.SphereGeometry(0.05, 16, 8);
        const instanceMaterial: THREE.Material = new THREE.MeshStandardMaterial({ color: "grey", metalness: 1, roughness: 0 });
        const instanceMesh: THREE.InstancedMesh = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, instanceCount);
        
        const vertex: THREE.Vector3 = new THREE.Vector3;
        const obj: THREE.Object3D = new THREE.Object3D();

        for (let i=0; i<=instanceCount-1; i++)
        {
            vertex.fromBufferAttribute(positions, i);
            obj.position.x = vertex.x;
            obj.position.y = vertex.y;
            obj.position.z = vertex.z;

            obj.updateMatrix();
            instanceMesh.setMatrixAt(i, obj.matrix);
            instanceMesh.instanceMatrix.needsUpdate = true;
        }

        this.Scene.add(instanceMesh);

        this.AdjustCamera();
        this.RenderAnimation(
            geometryMold,
            0.025,
            0.025,
            instanceMesh
        );
    }
    
    private RenderAnimation(
        instanceMoldGeometry: THREE.BufferGeometry,
        instanceMoldGeometryRotationRate: number,
        cameraRotationRate: number,
        instanceMesh: THREE.InstancedMesh)
      {
        const vertex = new THREE.Vector3;
        const obj: THREE.Object3D = new THREE.Object3D();

        this.Renderer.setAnimationLoop(() => 
        {
          instanceMoldGeometry.rotateZ(instanceMoldGeometryRotationRate);
          this.Camera.rotateZ(cameraRotationRate);
    
          const newPositions = instanceMoldGeometry.getAttribute('position');
    
          for (let i=0; i<=newPositions.count-1; i++)
          {
            vertex.fromBufferAttribute(newPositions, i);
            
            obj.position.x = vertex.x;
            obj.position.y = vertex.y;
            obj.position.z = vertex.z;

            obj.updateMatrix();
            instanceMesh.setMatrixAt(i, obj.matrix);
            instanceMesh.instanceMatrix.needsUpdate = true;
          }
        });
      }

    private AdjustCamera()
    {
        const cameraVector = new THREE.Vector3(Math.PI * 2.5, 1, 0.5);
        this.Camera.position.z = 0;
        this.Camera.position.y = 5.25;
        this.Camera.lookAt(cameraVector);
    }

}