import * as THREE from 'three';
import { Setup } from './Setup';

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

    public Generate(geometryMold: THREE.BufferGeometry) 
    {
        const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = geometryMold.getAttribute('position');
        const instanceCount: number = positions.count;
        const instanceGeometry: THREE.BufferGeometry = new THREE.SphereGeometry(0.04, 16, 8);
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const envMapTexture = cubeTextureLoader.load([
            '/textures/environmentMaps/0/px.jpg',
            '/textures/environmentMaps/0/nx.jpg',
            '/textures/environmentMaps/0/py.jpg',
            '/textures/environmentMaps/0/ny.jpg',
            '/textures/environmentMaps/0/pz.jpg',
            '/textures/environmentMaps/0/nz.jpg'
        ]);
        // adding metalness makes the instances appear black. Setting metalness to zero makes them reappear 
        // 
        const instanceMaterial: THREE.Material = new THREE.MeshStandardMaterial({ color: 'white', metalness: 0, envMap: envMapTexture });
        const instanceMesh: THREE.InstancedMesh = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, instanceCount);
        
        // const instancePositions: Float32Array = new Float32Array(instanceCount*3);
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
    }

    private AdjustCamera()
    {
        const cameraVector = new THREE.Vector3(Math.PI * 2.5, 1, 0.5);
        this.Camera.position.z = 0;
        this.Camera.position.y = 5.25;
        this.Camera.lookAt(cameraVector);
    }

}