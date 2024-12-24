import * as THREE from 'three';
import { Graph } from './types';
import { Setup } from './Setup';
import { AdjacencyMatrix, Indices } from './types';

export class Particles implements Graph {
    private Scene: THREE.Scene;
    private Camera: THREE.PerspectiveCamera;
    private Renderer: THREE.WebGLRenderer;
    private ShapeGeometryRotationRate: number;
    private CameraRotationRate: number;
    private GeometryMold: THREE.BufferGeometry;
    private AdjacencyMatrix: AdjacencyMatrix;
    private Particles: THREE.Points;

    constructor(
        setup: Setup,
        shapeGeometryRotationRate: number,
        cameraRotationRate: number,
        geometryMold: THREE.BufferGeometry) {
        this.Scene = setup.Scene;
        this.Camera = setup.Camera;
        this.Renderer = setup.Renderer;
        this.ShapeGeometryRotationRate = shapeGeometryRotationRate;
        this.CameraRotationRate = cameraRotationRate;
        this.GeometryMold = geometryMold;
        this.AdjacencyMatrix = this.CreateAdjacencyMatrixFromIndices();
        this.Particles = this.Generate();
    }

    public Generate(): THREE.Points {
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

        const particles = this.GenerateShape(particlesShape, particlesMaterial, particlesBaseColor);

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

        return particles;
    }

    public GenerateShape(
        geometry: THREE.BufferGeometry,
        material: THREE.Material,
        color: THREE.Color): THREE.Points {
        const geometryVertexPositions = geometry.getAttribute('position');
        const particleCount: number = geometryVertexPositions.count * 3;
        const particlePositions: Float32Array = new Float32Array(particleCount);
        const particlesColors: Float32Array = new Float32Array(particleCount);
        const particlesGeometry = new THREE.BufferGeometry();
        const vertex = new THREE.Vector3();

        let j = 0;
        for (let i = 0; i <= particleCount; i += 3) {
            vertex.fromBufferAttribute(geometryVertexPositions, j);
            particlePositions[i] = vertex.x;
            particlePositions[i + 1] = vertex.y;
            particlePositions[i + 2] = vertex.z;

            particlesColors[i] = color.r;
            particlesColors[i + 1] = color.g;
            particlesColors[i + 2] = color.b;

            j++;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));

        const particles = new THREE.Points(particlesGeometry, material);
        this.Scene.add(particles);

        return particles;
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
            const neighbors: number[] = this.AdjacencyMatrix[curr!];
            for (let i = 0; i <= neighbors.length - 1; i++) {
                if (!visited.includes(neighbors[i])) {
                    visited.push(neighbors[i]);
                    queue.push(neighbors[i]);
                }
            }
        }
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

    private AdjustCamera() {
        const cameraVector = new THREE.Vector3(Math.PI * 2.5, 1, 0.5);
        this.Camera.position.z = 0;
        this.Camera.position.y = 5.25;
        this.Camera.lookAt(cameraVector);
    }

    private RenderAnimation(
        particlesGeometry: THREE.BufferGeometry,
        shapeGeometry: THREE.BufferGeometry,
        particlePositions: Float32Array) {
        const vertex = new THREE.Vector3;
        this.Renderer.setAnimationLoop(() => {
            shapeGeometry.rotateZ(this.ShapeGeometryRotationRate);
            this.Camera.rotateZ(this.CameraRotationRate);

            const newTorusPositions = shapeGeometry.getAttribute('position');

            let j = 0;
            for (let i = 0; i <= particlePositions.length - 1; i += 3) {
                vertex.fromBufferAttribute(newTorusPositions, j);
                particlePositions[i] = vertex.x;
                particlePositions[i + 1] = vertex.y;
                particlePositions[i + 2] = vertex.z;

                j++;
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        });
    }

    private SetParticleColorsWithDelay = (
        colorIndex: number,
        particlesColors: Float32Array,
        colors: THREE.Color[],
        particlesGeometry: THREE.BufferGeometry) => {
        let delay: number = 0;
        const colorBufferAttribute = particlesGeometry.getAttribute('color');
        for (let i = 0; i <= particlesColors.length - 1; i += 3) {
            setTimeout(() => {
                particlesColors[i] = colors[colorIndex].r;
                particlesColors[i + 1] = colors[colorIndex].g;
                particlesColors[i + 2] = colors[colorIndex].b;
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
    ) {
        let intervalId: number;
        let colorIndex = 0;
        const dropdownBtns: NodeListOf<Element> = document.querySelectorAll('.startBtn')!;

        dropdownBtns.forEach(btn => {
            btn.addEventListener("mouseenter", () => {
                (btn as HTMLElement).style.width = "250px";
                if (btn.classList.contains('changeSpeed'))
                    (btn as HTMLElement).textContent = "Change Speed!";
                else if (btn.classList.contains('changeColor'))
                    (btn as HTMLElement).textContent = "Change Color!";
                else
                    (btn as HTMLElement).textContent = "Alternate Colors!";
            });

            btn.addEventListener("mouseleave", () => {
                (btn as HTMLElement).style.width = "75px";
                (btn as HTMLElement).textContent = "";
            });

            btn.addEventListener('click', () => {
                if (btn.classList.contains('changeSpeed')) {
                    this.ShapeGeometryRotationRate += 0.0025;
                    if (this.ShapeGeometryRotationRate > 0.0075)
                        this.ShapeGeometryRotationRate = 0.0025;

                    particlesShapeGeometry.rotateZ(this.ShapeGeometryRotationRate);

                } else if (btn.classList.contains('changeColor')) {
                    clearInterval(intervalId);
                    colorIndex++;
                    if (colorIndex > colors.length - 1) colorIndex = 0;
                    this.SetParticleColorsWithDelay(colorIndex, particlesColors, colors, particlesGeometry);
                } else {
                    clearInterval(intervalId)
                    intervalId = setInterval(() => {
                        this.SetParticleColorsWithDelay(colorIndex, particlesColors, colors, particlesGeometry);
                        //setParticlesColorsWithoutDelay(colorIndex);
                        colorIndex++;
                        if (colorIndex > colors.length - 1) colorIndex = 0;
                    }, 750);
                }
            });
        });
    }
};