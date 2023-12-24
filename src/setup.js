import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import * as dat from 'lil-gui'
import Stats from 'stats.js'

export let rowNum = 80
//126//80 //I hope to get here after using layers and maybe a camera trick?
export let rowOffsetP = (rowNum/2-0.5)
export let rowOffsetN = (-rowNum/2+0.5)
export let count = Math.pow(rowNum, 3)




export const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom

export const canvas = document.querySelector('canvas.webgl')

export const scene = new THREE.Scene()
//scene.background = new THREE.Color( 0xDFCFBE);
//scene.fog = null;//new THREE.Fog( 0x777777,  rowNum*0.5,  rowNum*4);

export const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

export const mouse = new THREE.Vector2();
window.addEventListener('pointermove', onPointerMove );
    function onPointerMove(e){
    
    mouse.x = ( e.clientX / sizes.width  ) * 2 - 1;
    mouse.y = - ( e.clientY / sizes.height ) * 2 + 1;
}

/**
 * Lights
 */
export const directionalLight = new THREE.DirectionalLight('#3366ff', 2.5)
directionalLight.castShadow = true
directionalLight.shadow.camera.near = rowNum
directionalLight.shadow.camera.far = rowNum*2.5
directionalLight.shadow.camera.top = rowNum
directionalLight.shadow.camera.right = rowNum
directionalLight.shadow.camera.bottom = - rowNum
directionalLight.shadow.camera.left = - rowNum
directionalLight.shadow.mapSize.set(1024*0.25, 1024*0.25)
directionalLight.shadow.normalBias = 0.01
directionalLight.shadow.bias = 0.00001
//directionalLight.shadow.radius = 15
//directionalLight.shadow.blurSamples = 15
directionalLight.position.set(-rowNum,rowNum,-rowNum*0.5)
scene.add(directionalLight)
directionalLight.layers.enable(1)



export const directionalLight2 = new THREE.DirectionalLight('#ff7733', 2.5)
directionalLight2.castShadow = true
directionalLight2.shadow.camera.near = rowNum
directionalLight2.shadow.camera.far = rowNum*2.5
directionalLight2.shadow.camera.top = rowNum
directionalLight2.shadow.camera.right = rowNum
directionalLight2.shadow.camera.bottom = - rowNum
directionalLight2.shadow.camera.left = - rowNum
directionalLight2.shadow.mapSize.set(1024*0.25, 1024*0.25)
directionalLight2.shadow.normalBias = 0.01
directionalLight2.shadow.bias = 0.00001
//directionalLight2.shadow.radius = 15
//directionalLight2.shadow.blurSamples = 8
directionalLight2.position.set(-rowNum*0.5,rowNum,-rowNum)

const helper = new THREE.CameraHelper( directionalLight2.shadow.camera);
//scene.add( helper );
scene.add(directionalLight2)
directionalLight2.layers.enable(1)

export const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)



export function addResizeListener(){
    window.addEventListener('resize', () =>
    {
            
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })
}

//voxels flicker with the perspective camera's near value set too low like 0.0001
//export const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 1, rowNum*10)
export const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, -rowNum, 200+rowNum );
camera.position.set(-rowNum, rowNum, -rowNum)
camera.zoom = 500/rowNum; // Adjust the zoom value as needed
camera.updateProjectionMatrix();
camera.layers.enable(1)
//camera.layers.set(1)
scene.add(camera)

// Controls
export const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.9
controls.rotateSpeed = 0.3
controls.mouseButtons = {
    LEFT: null ,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
}


/**
 * Renderer
 */
export const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3
renderer.shadowMap.enabled = true 
renderer.shadowMap.type = THREE.PCFSoftShadowMap //THREE.VSMShadowMap //
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.autoUpdate = false
//RAYCASTER
export const raycaster = new THREE.Raycaster()
raycaster.far = 200
//////////////////////////

/**
 * GUI
 */
export const gui = new dat.GUI()
export const myObject = {"mode": "Draw",
                  "Mesh Type": "Instanced",
                 "Camera View": "Default",
                 "drawColor":  0xffffff,
                 "paintColor": 0x0000ff,
                 "fillColor":  0xffff00,
                 "selectColor": 0xffff99,
                };
/*
gui.add( myObject, 'Mesh Type', [
                    "Instanced",
                    "Three Mesh"
                 ] );*/

export let referenceOfGUIModes = gui.add( myObject, 'mode', [
                            "Draw", 
                            //"Draw Plane",
                            //"Plane Extrude",
                            //"Plane Impress",
                            //"Face Select",
                            //"Face Extrude",
                            "Erase", 
                            //"Edit", 
                            "Paint",
                            //"Paint Single",
                            //"Fill",
                            "Select",
                            "Erase Selection",
                            "Paint Selection",
                            "Radial Select",
                            "Erase Radial Selection",
                            "Cylinder Select",
                            "Erase Cylinder Selection",
                            "All Of Color",
                            "Move",
                            "Object Mode",
                            "To Object",
                            "Rotate"
                         ] );

gui.add( myObject, 'Camera View', ["Default", "X","Y","Z"]).onChange(value =>{cameraChange(value)});

gui.addColor(myObject, 'drawColor')
gui.addColor(myObject, 'paintColor')
gui.addColor(myObject, 'fillColor')


export function cameraChange(value){
    switch (value) {
        case "Default":
            camera.lookAt(new THREE.Vector3(0.,0.,0.));
            camera.position.set(-rowNum, rowNum, -rowNum)
            break;
        case "X":
            camera.lookAt(new THREE.Vector3(-5.,0.,0.));
            camera.position.set(-rowNum,0,0)
            break;
        case "Y":
            camera.lookAt(new THREE.Vector3(0.,-5.,0.));
            camera.position.set(-0.001,rowNum,-0.001)
            break;
        case "Z":
            camera.lookAt(new THREE.Vector3(0.,0.,-5.));
            camera.position.set(0,0,-rowNum)
            break;
        default:
            break;
    }
}


export const boxGeo = new THREE.BoxGeometry(1,1,1);


const planeGeo = new THREE.PlaneGeometry(rowNum,rowNum,rowNum,rowNum)
const planeMat = new THREE.MeshStandardMaterial({color:"0xffdddd", wireframe: true,side: THREE.DoubleSide})
planeMat.transparent = true
planeMat.opacity = 0.1
const xPlane = new THREE.Mesh(planeGeo, planeMat)
xPlane.position.x = rowNum/2
xPlane.rotateY(-Math.PI/2)
const yPlane = new THREE.Mesh(planeGeo, planeMat)
yPlane.position.y = -rowNum/2
yPlane.rotateX(-Math.PI/2)
const zPlane = new THREE.Mesh(planeGeo, planeMat)
zPlane.position.z = rowNum/2
zPlane.rotateY(-Math.PI)
xPlane.userData.name = "X"
yPlane.userData.name = "Y"
zPlane.userData.name = "Z"
scene.add(xPlane)
scene.add(yPlane)
scene.add(zPlane)
export const planeList = [xPlane, yPlane, zPlane]
xPlane.layers.enable(1)
yPlane.layers.enable(1)
zPlane.layers.enable(1)
//yPlane.layers.set(1)

/*
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
renderer.setRenderTarget(renderTarget);
renderer.render(scene, camera);
renderer.setRenderTarget(null); // Reset the render target to the default renderer's canvas
camera.layers.set(1)
*/

const selectCubeCanvas = document.querySelector('canvas.selectCubeCanvas')

export const selectCubeRenderer = new THREE.WebGLRenderer({ canvas: selectCubeCanvas, alpha: true, premultipliedAlpha: true });
export const selectCubeScene = new THREE.Scene();
selectCubeScene.add(directionalLight)
selectCubeRenderer.setClearAlpha(0);
selectCubeRenderer.setSize(sizes.width, sizes.height)
selectCubeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

