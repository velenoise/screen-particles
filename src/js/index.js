'use strict'

const glslify = require('glslify'),
      THREE = require('three'),
      loop = require('raf-loop'),
      FBO = require('./fbo'),
      deg2rad = Math.PI / 180,
      OrbitControls = require('three-orbit-controls')(THREE);

let camera, cameraModel, renderer, scene, sceneModel;

// scene for rendering particles
camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 5;

// scene for depth rendering
cameraModel = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 130, 150);
cameraModel.position.z = 150;

renderer = new THREE.WebGLRenderer({
    clearAlpha: 1, 
    clearColor: 0x000000,
    logarithmicDepthBuffer: false
});
renderer.setSize(window.innerWidth, window.innerHeight);

scene = new THREE.Scene();
scene.add(camera);

sceneModel = new THREE.Scene();
sceneModel.add(cameraModel);

let planeHeight = 2.0 * camera.position.z * Math.tan(camera.fov * 0.5 * deg2rad);
let planeWidth = planeHeight * camera.aspect;
let width = 256, height = 256;

let data = getStartData( width, height, 256 );
let positions = new THREE.DataTexture( data, width, height, THREE.RGBFormat, THREE.FloatType );
positions.needsUpdate = true;

function getStartData( width, height){
    let len = width * height * 3,
        data = new Float32Array( len ),
        startX = -planeWidth * .5,
        startY = planeHeight * .5, 
        numVerts = width * height,
        incX = 0,
        incY = 0,
        vertsPerLine = 0,
        vertsPerColumn = 0;

    startX = -planeWidth * .5;
    startY = planeHeight * .5;
    vertsPerLine = Math.round(Math.sqrt(numVerts) * camera.aspect);
    incX = planeWidth / vertsPerLine;
    incY = planeHeight / (numVerts / vertsPerLine);

    for (let i = 0; i < numVerts; i++)
    {
        data[i * 3] = startX + (i % vertsPerLine) * incX;
        data[i * 3 + 1] = startY - (parseInt(i / vertsPerLine)) * incY;
        data[i * 3 + 2] = 0;
    }

    return data;
}

// Setup shaders
const simulationShader = new THREE.ShaderMaterial({
    uniforms: {
        positions: { type: 't', value: positions },
        depthMap: { type: 't', value: null },
        planeSize: { type: 'v2', value: new THREE.Vector2(planeWidth, planeHeight) },
        timer: { type: 'f', value: 0 }
    },
    vertexShader: glslify('../shaders/simulation.vert'),
    fragmentShader: glslify('../shaders/simulation.frag')
});

const renderShader = new THREE.ShaderMaterial({
    uniforms: {
        positions: { type: 't', value: null },
        pointSize: { type: 'f', value: 2 },
        timer: { type: 'f', value: 0 }
    },
    vertexShader: glslify('../shaders/render.vert'),
    fragmentShader: glslify('../shaders/render.frag'),
    transparent: true,
    blending: THREE.AdditiveBlending
});

// Init particles
FBO.init(width, height, renderer, simulationShader, renderShader);
scene.add(FBO.particles);

// Setup model for depth rendering
const depthMaterial = new THREE.MeshDepthMaterial();
const jsLoader = new THREE.JSONLoader();
let monkey;
jsLoader.load('monkey.json', (geo, mat) => {
    monkey = new THREE.Mesh(geo, depthMaterial);
    monkey.scale.x = monkey.scale.y = monkey.scale.z = 20;
    sceneModel.add(monkey);
});

document.body.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

let elapsedTime = 0;
const depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    format: THREE.RGBFormat, 
    type: THREE.FloatType,
    minFilter: THREE.LinearFilter, 
    magFilter: THREE.LinearFilter,
    stencilBufer: false 
});

loop(dt => {
    elapsedTime += dt;

    if (monkey) {
        monkey.position.x = Math.sin(elapsedTime * 0.001) * 25;
    }
    renderer.render(sceneModel, cameraModel, depthTarget, true);

    simulationShader.uniforms.depthMap.value = depthTarget.texture;
    simulationShader.uniforms.timer.value += 0.01;
    renderShader.uniforms.timer.value += 0.01;
    
    FBO.update();

    renderer.render(scene, camera);
}).start();