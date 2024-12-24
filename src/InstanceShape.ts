import * as THREE from 'three';
import { Setup } from './Setup';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { Graph, AdjacencyMatrix, Indices } from './types';

// Would be cool if certain algorithms could be used to traverse the vertices, like DFS or BFS, and
// this could then be used to color the vertices in a multitude of patterns. Or hell, just create cool 
// visualizations of various graph traversal algorithms. That would be a cool portfolio project, to show some
// understanding of DSA 
// How to determine neighbors of any given vertex?
// Index attribute of buffergeometry. 
/*
"Indexed geometries are different: Instead of repeating the vertices for all triangles, 
every vertex is stored only once. An additional attribute index is used to connect the 
vertices into triangles. So an index-attribute might look like this: [0, 1, 2, 0, 2, 3, ...] which reads 
as "construct first triangle from vertices at positions 0, 1 and 2" and so on."

Here I think 'positions' from 'construct first triangle from vertices at positions 0, 1 and 2...' means the position 
from the position bufferAttribute, or geometry.getAttribute('position'). So, get the index form geometry.index,
which will look like [0, 1, 2, 0, 2, 3, ...], and this indicates that vertex.fromBufferAttribute(positions, 0) is connected 
to vertex.fromBufferAttribute(positions, 1) and vertex.fromBufferAttribute(positions, 2), and similarly 
vertex.fromBufferAttribute(positions, 0) is connected to vertex.fromBufferAttribute(positions, 2) and vertex.fromBufferAttribute(positions, 3)?
*/

/*
curent issues:

- Make sure DFS/BFS are correct. setTimeOut() in particular. The rest of the function does not pause and wait for the setTimeOut fuction to complete

- How can I write this such that the both the Particles and InstanceShape classes can use the algorithms?
    - Can create a common interface which they both implement. Both classes arrange some element in the shape of a provided geometry, using the geometries vertices.
    - Create a class from which they both inherit

- Algorithm seems to work, but now the issue is that a BFS colors the instances the same as iterating through the positions array linearly does
    - So the question becomes, how can I find adjacent vertices in a specific direction? i.e. how can I color all the instances in a slice around the center of the shape?
    - Or is the adjacency array the issue? Are the relationships not being correctly represented? Wouldn't seem this way as all instances are reached?
    - Indices on bufferGeometry are null by default, maybe not necessarily TorusGeometry. Could be that the triangles are set on the Torus Geometry based on the indices and NOT based on each three contiguous positions in the positions array
        - Will try creating the adjacency matrix based on the index rather than contiguous positions in the positions array
    - SOMEWHAT SOLVED: Used indices to create the adjacency matrix, rather than the positions array. Also incremented the for loop by three while creating adjacency matrix.

- When the shape is not rotated, BFS does not seem to change color. Maybe rotation just made env map seem like it changed color? Didn't seem to be the case when black was included in colors array 
    - Maybe it has something to do with the fact that renderer.setAnimationLoop is being run concurrently?
    - If shape is not rotating it does not appear to change color, even if renderer.setAnimationLoop is being run
    - SOLVED: Removed duplicate instanceShape.Generate() in main.ts, and needed to set InstanceColor.needsUpdate tp true

- Animation is too slow. Pause every time BFS/DFS is run
- Could be that adjacency matrix is incorrect.
    - does it make sense that almost all vertices have four neighbors?
*/

export class InstanceShape implements Graph {
    private GeometryMold: THREE.BufferGeometry;
    public InstanceShape: THREE.InstancedMesh;
    private Camera: THREE.PerspectiveCamera;
    private Scene: THREE.Scene;
    private Renderer: THREE.WebGLRenderer;
    private AdjacencyMatrix: AdjacencyMatrix;

    constructor(setup: Setup, geometryMold: THREE.BufferGeometry) {
        this.GeometryMold = geometryMold;
        this.Camera = setup.Camera;
        this.Scene = setup.Scene;
        this.Renderer = setup.Renderer;
        this.AdjacencyMatrix = {};
        this.CreateAdjacencyMatrixFromIndices();
        this.InstanceShape = this.Generate();
        this.RenderAnimation(0.025, 0.025);

        // Still not sure if adjacency matrix is correct
        console.log(this.AdjacencyMatrix);
    }

    public CreateAdjacencyMatrixFromIndices(): AdjacencyMatrix {
        const am: AdjacencyMatrix = {};
        const indices = this.GeometryMold.index!.array;

        for (let i = 0; i <= indices.length - 1; i += 3) {
            const nodeIndex: number = indices[i];
            const connectingNode1Index: number = indices[i + 1];
            const connectingNode2Index: number = indices[i + 2];

            if (!(nodeIndex in am)) am[nodeIndex] = new Array();
            if (!(connectingNode1Index in am)) am[connectingNode1Index] = new Array();
            if (!(connectingNode2Index in am)) am[connectingNode2Index] = new Array();

            if (!am[nodeIndex].includes(connectingNode1Index)) am[nodeIndex].push(connectingNode1Index);
            if (!am[connectingNode1Index].includes(nodeIndex)) am[connectingNode1Index].push(nodeIndex);

            if (!am[nodeIndex].includes(connectingNode2Index)) am[nodeIndex].push(connectingNode2Index);
            if (!am[connectingNode2Index].includes(nodeIndex)) am[connectingNode2Index].push(nodeIndex);

            if (!am[connectingNode1Index].includes(connectingNode2Index)) am[connectingNode1Index].push(connectingNode2Index);
            if (!am[connectingNode2Index].includes(connectingNode1Index)) am[connectingNode2Index].push(connectingNode1Index);
        }
        this.AdjacencyMatrix = am;
        return am;
    }


    // Every three contiguous positions represents a triangle. I take this as a triangle starts at each item in the positions array
    // Could be that a separate triangle exists for each three items, but this results in a diconnected graph when constructing the adjacency matrix 
    public CreateAdjacencyMatrixFromPositions(): AdjacencyMatrix {
        const am: AdjacencyMatrix = {};
        const indices: Indices = {};
        const vertex = new THREE.Vector3();
        const connectingVertex1 = new THREE.Vector3();
        const connectingVertex2 = new THREE.Vector3();
        const positions = this.GeometryMold.getAttribute('position'); // Or, triangles are defined by the order of the vertices in the buffer

        for (let i = 0; i <= positions.count - 3; i++) {
            vertex.fromBufferAttribute(positions, i);
            connectingVertex1.fromBufferAttribute(positions, i + 1);
            connectingVertex2.fromBufferAttribute(positions, i + 2);
            const node: string = `${vertex.x}-${vertex.y}-${vertex.z}`; // relies on this being a unique identifier for a vertex
            const connectingNode1: string = `${connectingVertex1.x}-${connectingVertex1.y}-${connectingVertex1.z}`;
            const connectingNode2: string = `${connectingVertex2.x}-${connectingVertex2.y}-${connectingVertex2.z}`;

            if (!(node in indices)) indices[node] = i;
            if (!(connectingNode1 in indices)) indices[connectingNode1] = i + 1;
            if (!(connectingNode2 in indices)) indices[connectingNode2] = i + 2;

            const nodeIndex: number = indices[node];
            const connectingNode1Index: number = indices[connectingNode1];
            const connectingNode2Index: number = indices[connectingNode2];

            if (!(nodeIndex in am)) am[nodeIndex] = new Array();
            if (!(connectingNode1Index in am)) am[connectingNode1Index] = new Array();
            if (!(connectingNode2Index in am)) am[connectingNode2Index] = new Array();

            if (!am[nodeIndex].includes(connectingNode1Index)) am[nodeIndex].push(connectingNode1Index);
            if (!am[connectingNode1Index].includes(nodeIndex)) am[connectingNode1Index].push(nodeIndex);

            if (!am[nodeIndex].includes(connectingNode2Index)) am[nodeIndex].push(connectingNode2Index);
            if (!am[connectingNode2Index].includes(nodeIndex)) am[connectingNode2Index].push(nodeIndex);

            if (!am[connectingNode1Index].includes(connectingNode2Index)) am[connectingNode1Index].push(connectingNode2Index);
            if (!am[connectingNode2Index].includes(connectingNode1Index)) am[connectingNode2Index].push(connectingNode1Index);
        }
        this.AdjacencyMatrix = am;
        return am;
    }

    public DFS(color: THREE.Color): void // can maybe pass a function here 
    {
        let delay: number = 0;
        const startingIndex = 0;
        const visited: number[] = new Array();
        const stack: number[] = new Array();
        stack.push(startingIndex);

        while (stack.length > 0) {
            const curr = stack.pop()!;
            setTimeout(() => {
                this.InstanceShape.setColorAt(curr, color);
                this.InstanceShape.instanceColor!.needsUpdate = true;
            }, delay);
            delay += 0.5

            const neighbors = this.AdjacencyMatrix[curr!];
            for (let i = 0; i <= neighbors.length - 1; i++) {
                if (!visited.includes(neighbors[i])) {
                    visited.push(neighbors[i]);
                    stack.push(neighbors[i]);
                }
            }
        }
    }

    public BFS(color: THREE.Color): void {
        const visited: number[] = [];
        const startingIndex = 0;
        const queue: number[] = [];
        queue.push(startingIndex);
        let delay: number = 0;

        while (queue.length > 0) {
            const curr: number = queue.shift()!;
            setTimeout(() => {
                this.InstanceShape.setColorAt(curr, color);
                this.InstanceShape.instanceColor!.needsUpdate = true;
            }, delay);
            delay += 0.5;

            const neighbors: number[] = this.AdjacencyMatrix[curr!];

            for (let i = 0; i <= neighbors.length - 1; i++) {
                if (!visited.includes(neighbors[i])) {
                    visited.push(neighbors[i]);
                    queue.push(neighbors[i]);
                }
            }
        }
    }

    public SetEnvironmentMap() {
        const pmremGenerator = new THREE.PMREMGenerator(this.Renderer);
        new RGBELoader().load('../static/textures/wasteland_clouds_puresky_1k.hdr', (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            texture.dispose();
            this.Scene.environment = envMap;
        });
    }

    public Generate(): THREE.InstancedMesh {
        this.SetEnvironmentMap();
        const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = this.GeometryMold.getAttribute('position');
        const instanceCount: number = positions.count;
        const instanceGeometry: THREE.BufferGeometry = new THREE.SphereGeometry(0.075, 16, 8);
        const instanceMaterial: THREE.Material = new THREE.MeshStandardMaterial({ color: "grey", metalness: 1, roughness: 0 });
        instanceMaterial.needsUpdate = true;
        const instanceMesh: THREE.InstancedMesh = new THREE.InstancedMesh(instanceGeometry, instanceMaterial, instanceCount);

        const vertex: THREE.Vector3 = new THREE.Vector3;
        const obj: THREE.Object3D = new THREE.Object3D();

        for (let i = 0; i <= instanceCount - 1; i++) {
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

        return instanceMesh;
    }

    private RenderAnimation(
        instanceMoldGeometryRotationRate: number,
        cameraRotationRate: number) {
        const vertex = new THREE.Vector3;
        const obj: THREE.Object3D = new THREE.Object3D();

        this.Renderer.setAnimationLoop(() => {
            this.GeometryMold.rotateZ(instanceMoldGeometryRotationRate);
            this.Camera.rotateZ(cameraRotationRate);

            const newPositions = this.GeometryMold.getAttribute('position');

            for (let i = 0; i <= newPositions.count - 1; i++) {
                vertex.fromBufferAttribute(newPositions, i);

                obj.position.x = vertex.x;
                obj.position.y = vertex.y;
                obj.position.z = vertex.z;

                obj.updateMatrix();
                this.InstanceShape.setMatrixAt(i, obj.matrix);
                this.InstanceShape.instanceMatrix.needsUpdate = true;
            }
        });

        const colors: THREE.Color[] = [
            new THREE.Color().setRGB(0, 0, 0),
            new THREE.Color('rgb(250, 0, 0)'),
            new THREE.Color('rgb(100, 50, 0)'),
            new THREE.Color('rgb(75, 50, 25)')
        ]

        let j: number = 0;
        setInterval(() => {
            this.BFS(colors[j]);
            j++;
            if (j > colors.length - 1) j = 0;
        }, 2500)
    }

    private AdjustCamera() {
        const cameraVector = new THREE.Vector3(Math.PI * 2.5, 1, 0.5);
        this.Camera.position.z = 0;
        this.Camera.position.y = 5.25;
        this.Camera.lookAt(cameraVector);
    }

}