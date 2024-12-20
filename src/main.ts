import './style.css';
import { Particles } from './Particles';
import { ParticleHelpers } from './ParticlesHelpers';
import { Setup } from './Setup';
import { InstanceShape } from './InstanceShape';
import * as THREE from 'three';

/**
 * Setup
 */

// Or maybe click to change color, or mouseover to change color

const setup = new Setup();

let shapeGeometryRotationRate = 0.0025;
let cameraRotationRate = 0.0025;

const particlesHelper = new ParticleHelpers(setup.Scene);

const instanceShape = new THREE.TorusGeometry(5, 1, 75, 375);

new InstanceShape(setup).Generate(instanceShape);

// new Particles(
//   setup.Camera,
//   setup.Renderer,
//   particlesHelper,
//   shapeGeometryRotationRate,
//   cameraRotationRate).Generate();


