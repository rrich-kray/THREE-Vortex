import * as THREE from 'three';

export interface AdjacencyMatrix {
    [key: number]: number[]
}

export interface Indices {
    [key: string]: number
}

export interface sizes {
    height: number,
    width: number
}

export interface Graph {
    CreateAdjacencyMatrixFromIndices: () => AdjacencyMatrix;
    CreateAdjacencyMatrixFromPositions: () => AdjacencyMatrix;
    DFS: (color: THREE.Color) => void;
    BFS: (color: THREE.Color) => void;
}