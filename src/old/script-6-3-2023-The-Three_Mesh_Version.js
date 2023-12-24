import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import * as dat from 'lil-gui'

import Stats from 'stats.js'

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

/*
What I've learned is important:

- always use clone or copy to give a vector to another vector
- for changing a color, use set()
- console loggin with the wrong labels can make things harder
- adding a variable to a number in a three vector turns it into a string
*/

//INSTANCING 
/*
const maxInstances = 0;
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const instanceGeometry = new THREE.InstancedBufferGeometry();
instanceGeometry.copy(cubeGeometry)
const instancedMesh = new THREE.InstancedMesh(instanceGeometry, material, 0);
const indices = new Float32Array(0);

function addInstance(){
    const positionAttribute = instancedMesh.geometry.getAttribute("position");
    const colorAttribute = instancedMesh.geometry.getAttribute("color");
    const indexAttribute = instancedMesh.geometry.getAttribute('index');
    const instanceIndex = instancedMesh.count;//if 0-9 count is 10?

    positionAttribute.setXYZ(instanceIndex, x, y, z);//so add item 10?
    colorAttribute.setXYZ(instanceIndex, r, g, b);
    indexAttribute.setX(instanceIndex, instanceIndex);
    instancedMesh.count += 1; // Increase the count of instances
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    indexAttribute.needsUpdate = true;

}

function removeInstance(){
    const instanceIndexToRemove = 0;

    // Remove instance
    const positionAttribute = instancedMesh.geometry.getAttribute('position');
    const colorAttribute = instancedMesh.geometry.getAttribute('color');
    const indexAttribute = instancedMesh.geometry.getAttribute('index');
    
    // Shift instances down by overwriting the instance to be removed
    for (let i = instanceIndexToRemove; i < instancedMesh.count - 1; i++) {
      const nextIndex = i + 1;
      positionAttribute.setXYZ(i, positionAttribute.getX(nextIndex), positionAttribute.getY(nextIndex), positionAttribute.getZ(nextIndex));
      colorAttribute.setXYZ(i, colorAttribute.getX(nextIndex), colorAttribute.getY(nextIndex), colorAttribute.getZ(nextIndex));
      indexAttribute.setX(i, indexAttribute.getX(nextIndex) - 1); // Update instance indices
    }
    
    // Clear the attributes for the last instance
    const lastIndex = instancedMesh.count - 1;
    positionAttribute.setXYZ(lastIndex, 0, 0, 0);
    colorAttribute.setXYZ(lastIndex, 0, 0, 0);
    indexAttribute.setX(lastIndex, 0); // Clear the instance index
    
    instancedMesh.count -= 1; // Decrease the count of instances
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    indexAttribute.needsUpdate = true;
}
*/

/**
 * Base
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
let sceneList = []

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

const mouse = new THREE.Vector2();
window.addEventListener('pointermove', onPointerMove );
function onPointerMove(e){
    
    mouse.x = ( e.clientX / sizes.width  ) * 2 - 1;
    mouse.y = - ( e.clientY / sizes.height ) * 2 + 1;
}

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
scene.add(directionalLight)
const ambientLight = new THREE.AmbientLight()
scene.add(ambientLight)

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

/**
 * Camera
 */

//const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, 1, 100 );
camera.position.set(-12, 16, - 12)
camera.zoom = 50; // Adjust the zoom value as needed
camera.updateProjectionMatrix();

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.mouseButtons = {
    LEFT: null ,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


//RAYCASTER
const raycaster = new THREE.Raycaster()
//////////////////////////

/**
 * GUI
 */
const gui = new dat.GUI()
const myObject = {"mode": "Draw",
                 "Camera View": "Default",
                 "drawColor":  0xff0000,
                 "paintColor": 0x0000ff,
                 "fillColor":  0xffff00
                };

gui.add( myObject, 'mode', [
                            "Draw", 
                            "Draw Plane",
                            "Plane Extrude",
                            "Face Select",
                            "Face Extrude",
                            "Erase", 
                            "Edit", 
                            "Paint",
                            "Paint Single",
                            "Fill",
                         ] );

gui.add( myObject, 'Camera View', ["Default", "X","Y","Z"]).onChange(value =>{cameraChange(value)});

gui.addColor(myObject, 'drawColor')
gui.addColor(myObject, 'paintColor')
gui.addColor(myObject, 'fillColor')


function cameraChange(value){
    switch (value) {
        case "Default":
            camera.lookAt(new THREE.Vector3(0.,0.,0.));
            camera.position.set(-12, 16, -12)
            break;
        case "X":
            camera.lookAt(new THREE.Vector3(-5.,0.,0.));
            camera.position.set(-12,0,0)
            break;
        case "Y":
            camera.lookAt(new THREE.Vector3(0.,-5.,0.));
            camera.position.set(-0.001,12,-0.001)
            break;
        case "Z":
            camera.lookAt(new THREE.Vector3(0.,0.,-5.));
            camera.position.set(0,0,-12)
            break;
        default:
            break;
    }
}

const boxGeo = new THREE.BoxGeometry(1,1,1);

const rowNum = 2
const count = Math.pow(rowNum, 3)
//INSTANCING 
const geometry = new THREE.BoxGeometry(1, 1, 1);
geometry.computeVertexNormals();
const material = new THREE.MeshNormalMaterial()
const mesh = new THREE.InstancedMesh(geometry, material, count);
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
scene.add(mesh);
mesh.count = 0

function getPosition(){
    
}


let drawing = false
let drawList = []
window.addEventListener('mousedown', function(event){if(event.buttons === 1){drawing = true;}});
window.addEventListener('mouseup', function(){drawing = false; drawList = []});

const worldDictionary = {}

function getKey(p){
    return JSON.stringify(p.toArray())
}

function createVoxel(p){
    /*
    let dmy = new THREE.Object3D()
    //const p = new THREE.Vector3(Math.random()*10-5, Math.random()*10-5, Math.random()*10-5); // New position
    dmy.position.set( p.x, p.y, p.z );
    dmy.updateMatrix();
    mesh.setMatrixAt( mesh.count , dmy.matrix );
    
    
    console.log("vox added!");
    worldDictionary[getKey(p)] = mesh.count
    mesh.count ++ 
    mesh.instanceMatrix.needsUpdate = true;
*/

    let vox = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({color:myObject.drawColor}))
    vox.position.copy(p);
    vox.userData.visited = false
    scene.add(vox)
    sceneList.push(vox)
    worldDictionary[getKey(vox.position)] = vox
    return vox
}

function drawVoxels(){

    if(drawing && myObject.mode == "Draw"){
        let p = getHitPos()

        if(p){
            let vox = createVoxel(p)
            drawList.push(vox)
        }
    }
}

window.addEventListener('click', () =>
{
    if(myObject.mode == "Fill"){
        let vox = getHitVoxel();

        if(vox){
            bfs(vox.object)
        }
    }
})

window.addEventListener('click', () =>
{
    if(myObject.mode == "Paint Single"){
        let vox = getHitVoxel();
        if(vox){
            vox.object.material.color.set(myObject.paintColor)
        }
    }
})

let painting = false
window.addEventListener('mousedown', function(){painting = true})
window.addEventListener('mouseup', function(){painting = false})
function paint(){
    if(myObject.mode == "Paint" && painting == true){
        let vox = getHitVoxel();
        if(vox){
            vox.object.material.color.set(myObject.paintColor)
        }
    }
}


let overlapList = []
function deleteOverlaps(){
    for(let vox of overlapList){
        sceneList = sceneList.filter(obj => obj !== vox);
        scene.remove(vox)
        vox.material.dispose()
    }
    overlapList = []
    console.log("overlapList length: " + overlapList.length);
    console.log("scene length: " + sceneList.length);
    console.log(worldDictionary);
}

window.addEventListener('click', () => {
    if(myObject.mode == "Draw Plane"){
        console.log("draw plane");
        let plane = getHitPlane();
        if(plane){
            let axis = plane.userData.name
            console.log(axis);
            fillPlane(axis)
        }
    }
})

function fillPlane(axis){
    for(let i = 4.5; i >= -4.5; i--){
        for(let j = 4.5; j >= -4.5; j--){
            //check if something is there
            let p;
            switch(axis){
                case "X":p = new THREE.Vector3(4.5,i,j);  break;//set that final value  that can't be set with floor
                case "Y":p = new THREE.Vector3(i,-4.5,j); break;
                case "Z":p = new THREE.Vector3(i,j,4.5);  break;
            }
            let key = getKey(p)
            if(worldDictionary.hasOwnProperty(key)){
                overlapList.push(worldDictionary[key])
            }
            createVoxel(p)
        }
    }
    deleteOverlaps()
}

let extruding = false
let extrudeStart = null
let extrudeNormal = null
//let extrudeFrom  = null
let extrudeList = []
let extrudeMouseStart = new THREE.Vector2()

window.addEventListener('mousedown', function(event){if(event.buttons === 1){ extruding = true; }});
window.addEventListener('mouseup', function(){ extruding = false; 
                                                extrudeList = []; 
                                                extrudeStart = null; 
                                                extrudeNormal = null; 
                                                extrudeMouseStart = new THREE.Vector2() });


window.addEventListener('mousedown', function(){
    console.log("wow");
    if(myObject.mode == "Plane Extrude"){
        let hit = getHit()
        if(hit){
            extrudeNormal = hit.face.normal
            extrudeStart = hit
            extrudeMouseStart = mouse.clone()
        }
        
    }
})

function getExtrudeDelta(){
    let dx = parseFloat(((mouse.x - extrudeMouseStart.x)*10).toFixed(0))
    let dy = parseFloat(((mouse.y - extrudeMouseStart.y)*10).toFixed(0))
    console.log("dx: " + dx + ", " + "dy: " + dy);
    return [dx,dy]
}

function Extrude(){
    if(myObject.mode == "Plane Extrude" && extruding && extrudeStart){
        let [dx,dy] = getExtrudeDelta()
        //console.log(extrudeStart);
        if(extrudeStart.object.geometry instanceof THREE.PlaneGeometry){
            fillPlaneExtrusion(extrudeStart.object.userData.name, extrudeStart, dx, dy)
        }
        else{
            let axis = "X"; 
            if(Math.abs(extrudeStart.face.normal.y) > 0.5){
                axis = "Y"
            }
            else if(Math.abs(extrudeStart.face.normal.z) > 0.5){
                axis = "Z"
            }
            fillPlaneExtrusion(axis, extrudeStart, dx, dy)
        }
    }
}

function fillPlaneExtrusion(axis,hit, dx,dy){
    console.log("fill plane extrustion");
    for(let i = 4.5; i >= -4.5; i--){
        for(let j = 4.5; j >= -4.5; j--){
            //check if something is there
            let p;
            switch(axis){
                case "X":p = new THREE.Vector3(hit.point.x-0.5-dx,i,j);  break;//set that final value  that can't be set with floor
                case "Y":p = new THREE.Vector3(i,hit.point.y+0.5+dy,j); break;
                case "Z":p = new THREE.Vector3(i,j,hit.point.z-0.5+dx);  break;
            }
            console.log(p)
            let key = getKey(p)
            if(worldDictionary.hasOwnProperty(key)){
                overlapList.push(worldDictionary[key])
                //continue;
            }
            createVoxel(p)
        }
    }
    deleteOverlaps()
}

function planeExtrude(){
    if(myObject.mode == "Plane Extrude" && extruding && extrudeStart){
        let [dx,dy] = getExtrudeDelta()
        //console.log(extrudeStart);
        fillExtrusion(extrudeStart.object.userData.name, dx, dy)
    }
}



function fillExtrusion(axis, dx,dy){
    console.log("fill extrustion");
    for(let i = 4.5; i >= -4.5; i--){
        for(let j = 4.5; j >= -4.5; j--){
            //check if something is there
            let p;
            switch(axis){
                case "X":p = new THREE.Vector3(4.5-dx,i,j);  break;//set that final value  that can't be set with floor
                case "Y":p = new THREE.Vector3(i,-4.5+dy,j); break;
                case "Z":p = new THREE.Vector3(i,j,4.5+dx);  break;
            }
            console.log(p)
            let key = getKey(p)
            if(worldDictionary.hasOwnProperty(key)){
                overlapList.push(worldDictionary[key])
                //continue;
            }
            createVoxel(p)
        }
    }
    deleteOverlaps()
}


function deleteVoxel(vox){
    sceneList = sceneList.filter(obj => obj !== vox);
    scene.remove(vox)
    vox.material.dispose()
    let key = JSON.stringify(vox.position.toArray())
    delete worldDictionary[key]
}



let erasing = true
let eraseList = []
window.addEventListener('mouseup', function(){erasing = false; eraseList = [];});
window.addEventListener('mousedown', function(event){if(event.buttons === 1){erasing = true;}});

function erase(){
    if(erasing && myObject.mode == "Erase"){
        let vox = getEraseHit()
        if(vox){
            deleteVoxel(vox)
        }
    }
}



const planeGeo = new THREE.PlaneGeometry(10,10,10,10)
const planeMat = new THREE.MeshStandardMaterial({color:"blue", wireframe: true,side: THREE.DoubleSide})
const xPlane = new THREE.Mesh(planeGeo, planeMat)
xPlane.position.x = 5
xPlane.rotateY(-Math.PI/2)
const yPlane = new THREE.Mesh(planeGeo, planeMat)
yPlane.position.y = -5
yPlane.rotateX(-Math.PI/2)
const zPlane = new THREE.Mesh(planeGeo, planeMat)
zPlane.position.z = 5
zPlane.rotateY(-Math.PI)
xPlane.userData.name = "X"
yPlane.userData.name = "Y"
zPlane.userData.name = "Z"
scene.add(xPlane)
scene.add(yPlane)
scene.add(zPlane)
const planeList = [xPlane, yPlane, zPlane]




const dirs = [new THREE.Vector3(1.,0.,0.),
              new THREE.Vector3(-1.,0.,0.),
              new THREE.Vector3(0.,1.,0.),
              new THREE.Vector3(0.,-1.,0.),
              new THREE.Vector3(0.,0.,1.),
              new THREE.Vector3(0.,0.,-1.),
            ]

/* basic bfs is like the level order traversal for a binary tree
wurzel in queue pop queue(wurzel first round) add popped to ergebnis put children in queue */

const bfsRaycaster = new THREE.Raycaster()

function bfs(root){
    root.userData.visited = true 
    let q = [root], erg = []
    root.material.color.set( myObject.fillColor); //change color
    while(q.length){
        let akt = q.pop()
        erg.push(akt)
        let rayOrigin = akt.position
        
        for(let dir of dirs){ //for each cube direction
            //test if cube exists at testPos 
            bfsRaycaster.set(rayOrigin, dir, 0, 1)
            let hits = bfsRaycaster.intersectObjects(sceneList); //sometimes gives dups
            for ( let i = 0; i < hits.length; i++ ) {
                
                if(hits[i].object != akt &&  //and isn't visited and isn't the akt node
                    hits[i].object.userData.visited == false &&
                    hits[i].distance < 0.75){

                    hits[i].object.material.color.set(myObject.fillColor); //change color
                    hits[i].object.userData.visited = true //set visited to true
                    q.push(hits[i].object) //add to queue
                }
            }
        }
    }   
    for(let e of erg){ //set all to visited false again
        e.userData.visited = false
    }
}





/***************************************************************** */
window.addEventListener('mousedown', function(event){
                if(event.buttons === 1 && 
                   myObject.mode == "Face Select" && 
                   !getHit()){
                    
                    console.log("no hit. deselecting...");
                    for(let vox of selectedList){
                        vox.material.color.set("blue")
                    }
                    selectedList = []
                }
            })

window.addEventListener('mouseup', function(event){
    console.log("no hit. deselecting...up");
        if(myObject.mode == "Face Select"){
            
            
            for(let vox of selectedList){
                console.log("blue");
                vox.material.color.set("blue")
            }
            for(let vox of extendSelectedList){
                console.log("blue!");
                vox.material.color.set("blue")
            }
            selectedList = []
            extendSelectedList = [] 
        }
    })
/***************************************************************** */




window.addEventListener('mousedown', function(){
    if(myObject.mode == "Face Select"){
        selectedList = []
        let hit = getHit()

        if(hit){
            extrudeNormal = hit.face.normal
            extrudeStart = hit
            extrudeMouseStart = mouse.clone()
        }
        
    }
})

function faceExtrude(){
    if(myObject.mode == "Face Select" && 
        extruding && 
        extrudeStart && 
        selectedList.length > 0){

        let [dx,dy] = getExtrudeDelta()

        let axis = "X"; 
        if(Math.abs(extrudeStart.face.normal.y) > 0.5){
            axis = "Y"
        }
        else if(Math.abs(extrudeStart.face.normal.z) > 0.5){
            axis = "Z"
        }

        fillFaceExtrusion(axis, dx, dy)
        
    }
}
 let extendSelectedList = []
function fillFaceExtrusion(axis, dx,dy){
   // console.log("fill face extrustion");
   
    for(let vox of selectedList){
    //    for(let j = 4.5; j >= -4.5; j--){
            //check if something is there
        let p = vox.position.clone()
        let offset;
        switch(axis){
            case "X":offset = new THREE.Vector3(-dx,0,0);  break;//set that final value  that can't be set with floor
            case "Y":offset = new THREE.Vector3(0,+dy,0); break;
            case "Z":offset = new THREE.Vector3(0,0,+dx);  break;
        }
        p.add(offset)
        let key = getKey(p)
        let existed = worldDictionary.hasOwnProperty(key)
        if(existed){
            //if we try to do the overlapping we end up 
            //overwritting voxels so that what is in the selected list
            //wont actually be whats in the scene
            //overlapList.push(worldDictionary[key])
            continue;
        }
        createVoxel(p)
        worldDictionary[key].material.color.set("yellow")
        if(!existed){
            extendSelectedList.push(worldDictionary[key]) 
         }
       // 
        //}
    }
    deleteOverlaps()
    //selectedList = selectedList.concat(extendSelectedList)
    console.log(extendSelectedList);
    console.log(selectedList);
}

const faceXDirs = [
    new THREE.Vector3(0.,1.,0.),
    new THREE.Vector3(0.,-1.,0.),
    new THREE.Vector3(0.,0.,1.),
    new THREE.Vector3(0.,0.,-1.)
  ]
const faceYDirs = [
    new THREE.Vector3(1.,0.,0.),
    new THREE.Vector3(-1.,0.,0.),
    new THREE.Vector3(0.,0.,1.),
    new THREE.Vector3(0.,0.,-1.)
  ]
  const faceZDirs = [
    new THREE.Vector3(1.,0.,0.),
    new THREE.Vector3(-1.,0.,0.),
    new THREE.Vector3(0.,1.,0.),
    new THREE.Vector3(0.,-1.,0.)
  ]

  window.addEventListener('mousedown', () =>
  {
    console.log("face select");
      if(myObject.mode == "Face Select"){
        let vox = getHitVoxel();

        if(vox){
            if(Math.abs(vox.face.normal.x) > 0.5){
                faceBFS(vox.object, faceXDirs, vox.face.normal)
            }
            else if(Math.abs(vox.face.normal.y) > 0.5){
                faceBFS(vox.object, faceYDirs, vox.face.normal)
            } 
            else {
                faceBFS(vox.object, faceZDirs, vox.face.normal)
            }  
        }
    }
  })

let selectedList = []

function faceBFS(root, faceDirs, excludeDir){
    root.userData.visited = true 
    let q = [root], erg = []
    root.material.color.set( myObject.fillColor); //change color
    while(q.length){
        let akt = q.pop()
        erg.push(akt)
        selectedList.push(akt)

        let rayOrigin = akt.position
        
        for(let dir of faceDirs){ //for each cube direction
            //test if cube exists at testPos 
            bfsRaycaster.set(rayOrigin, dir, 0, 1)
            let hits = bfsRaycaster.intersectObjects(sceneList); //sometimes gives dups
            for ( let i = 0; i < hits.length; i++ ) {
                
                let excludePos = hits[i].object.position.clone()
                excludePos.add(excludeDir)
                let exludeKey = getKey(excludePos)

                if(hits[i].object != akt &&  //and isn't visited and isn't the akt node
                    hits[i].object.userData.visited == false &&
                    hits[i].distance < 0.75 && !worldDictionary.hasOwnProperty(exludeKey)){

                    hits[i].object.material.color.set(myObject.fillColor); //change color
                    hits[i].object.userData.visited = true //set visited to true
                    q.push(hits[i].object) //add to queue
                }
            }
        }
    }   
    for(let e of erg){ //set all to visited false again
        e.userData.visited = false
    }
}

function getHitPos(){
    const hits = raycaster.intersectObjects(scene.children)

    if(hits.length > 0){
        if(hits[0].object.geometry instanceof THREE.PlaneGeometry){
            let p = hits[0].point.clone();
            let hitPos = new THREE.Vector3(Math.floor(p.x)+0.5,Math.floor(p.y)+0.5,Math.floor(p.z)+0.5)
            //use the Vector3.floor() and Vector3.addScalar()
            switch(hits[0].object.userData.name){
                case "X":hitPos.x = 4.5;  break;//set that final value  that can't be set with floor
                case "Y":hitPos.y = -4.5; break;
                case "Z":hitPos.z = 4.5;  break;
            }
        return hitPos
        }

        else{
            if(drawList.includes(hits[0].object)){
                return null
            }
            else{
                let n = hits[0].face.normal.clone() //without clone the draw calls keep happening
                let p = hits[0].object.position.clone() //because we keep updating the positions etc?
                p.add(n)
                return p
            }
       }
    }

    return null
}

function getHit(){
    const hits = raycaster.intersectObjects(scene.children)

    if(hits.length > 0){
        return hits[0]
    }
    return null
}

function getHitPlane(){
    const hits = raycaster.intersectObjects(scene.children)

    if(hits.length > 0 && hits[0].object.geometry instanceof THREE.PlaneGeometry){
        return hits[0].object
    }
}

function getHitVoxel(){

    const hits = raycaster.intersectObjects(scene.children)

    if(hits.length > 0){
        if(hits[0].object.geometry instanceof THREE.BoxGeometry){
            return hits[0]
        }
    }
    return null
}

const voxelAlongRaycaster = new THREE.Raycaster()

function getHitVoxelAlongRay(origin, dir){

    voxelAlongRaycaster.set(origin, dir, 0, 1)
    const hits = voxelAlongRaycaster.intersectObjects(sceneList)

    if(hits.length > 0){
        if(hits[0].object.geometry instanceof THREE.BoxGeometry){
            return hits[0].object
        }
    }
    return null
}

function getEraseHit(){
    const hits = raycaster.intersectObjects(scene.children)

    if(hits.length > 0){
        if(hits[0].object.geometry instanceof THREE.BoxGeometry){
            
            if(eraseList.includes(hits[0].object)){
                return null
            }
            else{
                if(hits.length > 1 && hits[1].object.geometry instanceof THREE.BoxGeometry){
                    eraseList.push(hits[1].object)
                }
                return hits[0].object
            }
       }
    }
    return null
}

const tick = () =>
{
    stats.begin()
    raycaster.setFromCamera(mouse, camera)
    controls.update()

    erase()
    drawVoxels()
    //planeExtrude()
    Extrude()
    faceExtrude()
    paint()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
    stats.end()
    
}

tick()
