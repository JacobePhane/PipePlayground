import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import * as dat from 'lil-gui'
import Stats from 'stats.js'

//import * as voxelUtils from './voxelUtils.js'
//import {oneThing,logMesh} from './voxelUtils.js'


//console.log(oneThing);
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

/*
What I've learned is important:

- always use clone or copy to give a vector to another vector
- for changing a color, use set()
- console loggin with the wrong labels can make things harder
- adding a variable to a number in a three vector turns it into a string
- matrix4 functions are very important and chatgpt doesn't know them all

- *Anticipate change! Assume whatever data format/structure you're using
will change and prepare for it by using agnostic functions that you can 
easily adjust rather than coding as if object.position will always be a thing!

- setColor wasn't working in the changeCOlor function
- I logged mesh.instanceColor and it was null, apparently it needs to be 
set using setColor to even exist

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
const camera = new THREE.OrthographicCamera( sizes.width / - 2, sizes.width / 2, sizes.height / 2, sizes.height / - 2, -10, 100 );
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
                  "Mesh Type": "Instanced",
                 "Camera View": "Default",
                 "drawColor":  0xff0000,
                 "paintColor": 0x0000ff,
                 "fillColor":  0xffff00,
                 "selectColor": 0xffff99,
                };

gui.add( myObject, 'Mesh Type', [
                    "Instanced",
                    "Three Mesh"
                 ] );

gui.add( myObject, 'mode', [
                            "Draw", 
                            "Draw Plane",
                            "Plane Extrude",
                            "Plane Impress",
                            "Face Select",
                            "Face Extrude",
                            "Erase", 
                            "Edit", 
                            "Paint",
                            "Paint Single",
                            "Fill",
                            "Rect Select",
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

const rowNum = 10
const rowOffsetP = (rowNum/2-0.5)
const rowOffsetN = (-rowNum/2+0.5)
const count = Math.pow(rowNum, 3)
//INSTANCING 
const geometry = new THREE.BoxGeometry(1, 1, 1);
geometry.computeVertexNormals();
const material = new THREE.MeshPhongMaterial({color: 0xffffff,vertexColors: THREE.VertexColors})
const mesh = new THREE.InstancedMesh(geometry, material, count);
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
scene.add(mesh);
mesh.count = 0
mesh.setColorAt(0, new THREE.Color(0xffffff))

const worldDictionary = {}
//logMesh(mesh)

let drawing = false
let drawList = []
window.addEventListener('mousedown', function(event){if(event.buttons === 1){drawing = true;}});
window.addEventListener('mouseup', function(){drawing = false; drawList = []});



function getKey(p){
    return JSON.stringify(p.toArray())
}

function positionInDict(dict, p){
    let key = getKey(p)
    return dict.hasOwnProperty(key)
}

function getIdAtPostion(p){
    return worldDictionary[getKey(p)]

}

function addToDict(dict, p){
    dict[getKey(p)] = getIdAtPostion(p)
}

function getDummyWithP(p){
    let dmy = new THREE.Object3D()
    dmy.position.set( p.x, p.y, p.z );
    dmy.updateMatrix();
    return dmy
}

function loadVoxel(p){
    let dmy = getDummyWithP(p)
    mesh.setMatrixAt(mesh.count, dmy.matrix);
    setInstanceColor(mesh.count, myObject.drawColor)
    worldDictionary[getKey(p)] = mesh.count
    mesh.count ++ 
    mesh.instanceMatrix.needsUpdate = true;
}

function fillWorld(){
    let i = 0
    let dummy = new THREE.Object3D()
    for ( let x = rowOffsetN; x <= rowOffsetP; x ++ ) {
        for ( let y = rowOffsetN; y <= rowOffsetP; y ++ ) {
            for ( let z = rowOffsetN; z <= rowOffsetP; z ++ ) {
                let p = new THREE.Vector3(x,y,z+1000)
                loadVoxel(p)
                //dummy.position.set(x,y,z );
                //dummy.updateMatrix();
                //mesh.setMatrixAt( i ++, dummy.matrix );
                
            }
        }
    }
    mesh.instanceMatrix.needsUpdate = true;
}
fillWorld()


function positionInList(p, list){
   return list.some(item => item.equals(p));
}


function changeVoxPosition(p1, p2){
    //if an id is undefined it means we are trying to get it from the farplane 
    //but its already in the world
    let dmy = getDummyWithP(p2)
    let id = getIdAtPostion(p1)

    //without this if statement it seems we wipe the dictionary sometimes 
    //like during extruding when the mouse is held down
    //it's also a lot slower to go through all these operations when there is no need
    if(id != undefined){//don't check for just id because when id is 0 it will be false
    mesh.setMatrixAt(id, dmy.matrix);
    setInstanceColor(id, myObject.drawColor)
    delete worldDictionary[getKey(p1)]
    worldDictionary[getKey(p2)] = id
    mesh.instanceMatrix.needsUpdate = true;
    }
}

function getInstancePositionByID(id){

    let p = new THREE.Vector3()
    let mat = new THREE.Matrix4()
    mesh.getMatrixAt(id, mat)    
    p.setFromMatrixPosition(mat)
    return p

}

function getInstancePositionByVoxel(vox){

    switch (myObject['Mesh Type']) {
        case "Instanced":
            let p = new THREE.Vector3()
            let i = vox.instanceId
            let mat = new THREE.Matrix4()
            mesh.getMatrixAt(i, mat)    
            p.setFromMatrixPosition(mat)
            return p
    
        default:
            return vox.object.position
    }
    
}

function setInstanceColor(id, colorChoice){
    let co = new THREE.Color()
    co.setHex(colorChoice)
    mesh.setColorAt(id, co)
    mesh.instanceColor.needsUpdate = true
}


function createVoxel(p){
    
    if(myObject['Mesh Type'] == "Instanced" ){
        /*let dmy = new THREE.Object3D()
        dmy.position.set( p.x, p.y, p.z );
        dmy.updateMatrix();
        mesh.setMatrixAt(mesh.count, dmy.matrix);
        setInstanceColor(mesh.count)
        console.log("vox added!");
        worldDictionary[getKey(p)] = mesh.count
        console.log(worldDictionary[getKey(p)])
        console.log(worldDictionary.hasOwnProperty(getKey(p))); 
        mesh.count ++ 
        mesh.instanceMatrix.needsUpdate = true;*/
        let p_from_farplane = p.clone()
        p_from_farplane.z += 1000
        changeVoxPosition(p_from_farplane,p)
    }
    else if(myObject['Mesh Type'] == "Three Mesh"){
        let vox = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({color:myObject.drawColor}))
        vox.position.copy(p);
        vox.userData.visited = false
        scene.add(vox)
        sceneList.push(vox)
        worldDictionary[getKey(vox.position)] = vox
        return vox
    }
}

function drawVoxels(){

    if(drawing && myObject.mode == "Draw"){
        let p = getHitPos()

        if(p){
            let vox = createVoxel(p)

            if(myObject['Mesh Type'] == "Instanced"){
                drawList.push(p)
            }
            else{
                drawList.push(vox)
            }
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
            if(myObject['Mesh Type']=="Three Mesh"){
            vox.object.material.color.set(myObject.paintColor)
            }
            else if(myObject["Mesh Type"]=="Instanced"){
                setInstanceColor(vox.instanceId, myObject.paintColor)
                
            }
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
            if(myObject['Mesh Type']=="Three Mesh"){
            vox.object.material.color.set(myObject.paintColor)
            }
            else if(myObject["Mesh Type"]=="Instanced"){
                setInstanceColor(vox.instanceId, myObject.paintColor)
                
            }
        }
    }
}

function checkMatchingVector3(a,b){
    return (a.x==b.x && a.y == b.y && a.z == b.z)
}
let rectSelectFrom, rectSelectTo, rectSelectNormal;
//rectFromOriginalColor, rectToOriginalColor
function RectSelect(){
    if(myObject.mode == "Rect Select"){
        let hit = getHitVoxel()
        if(hit){
            
            if(rectSelectFrom){
                console.log("we have a from ");console.log("normal is:");
                console.log(hit.face.normal);
                if(checkMatchingVector3(hit.face.normal , rectSelectNormal)){
                    console.log("matching normals");
                    if(rectSelectTo){
                        setInstanceColor(getIdAtPostion(rectSelectTo), myObject.drawColor)
                        rectSelectTo = getInstancePositionByVoxel(hit)
                        setInstanceColor(getIdAtPostion(rectSelectTo), myObject.selectColor)
                    }else{
                        rectSelectTo = getInstancePositionByVoxel(hit)
                        setInstanceColor(getIdAtPostion(rectSelectTo), myObject.selectColor)
                    }

                    console.log("to :");
                    console.log(rectSelectTo);
                }
            }
            else{
                rectSelectFrom = getInstancePositionByVoxel(hit)
                console.log("from: ");
                console.log(rectSelectFrom);
                console.log(hit);
                setInstanceColor(getIdAtPostion(rectSelectFrom), myObject.selectColor)
                rectSelectNormal = hit.face.normal
                console.log("normal set to: ");
                console.log(rectSelectNormal);
            }
        }
        
    }
}
window.addEventListener('mouseup', function(){
    if(myObject.mode == "Rect Select"){
        if(rectSelectTo && rectSelectFrom){
            console.log("select all voxels from: ");
            console.log(rectSelectFrom);
            console.log("to :");
            console.log(rectSelectTo);
        }
     //   else{
            rectSelectFrom = null
            rectSelectTo = null
     //   }
    }
})


let overlapList = []
function deleteOverlaps(){
    if(myObject['Mesh Type'] == "Three Mesh"){
        for(let vox of overlapList){
            sceneList = sceneList.filter(obj => obj !== vox);
            scene.remove(vox)
            vox.material.dispose()
        }
        
    }else if(myObject['Mesh Type'] == "Instanced"){
        //console.log(overlapList);
        /*for(let id of overlapList){
            deleteInstanceAtId(id)
        }*/
    }
    overlapList = []
    /*
    if(myObject['Mesh Type']=="Three Mesh"){
        sceneList = sceneList.filter(obj => obj !== vox);
        scene.remove(vox)
        vox.material.dispose()
        let key = JSON.stringify(vox.position.toArray())
        delete worldDictionary[key]
    }
    else if(myObject['Mesh Type']=="Instanced"){
        let id = vox.instanceId
        let p = getInstancePosition(vox)
        let key = getKey(p)
        deleteInstance(id)
        delete worldDictionary[key]

    }
    */
}

window.addEventListener('click', () => {
    if(myObject.mode == "Draw Plane"){
        console.log("draw plane");
        let plane = getHitPlane();
        if(plane){
            let axis = plane.object.userData.name
            console.log(axis);
            fillPlane(axis)
        }
    }
})

function fillPlane(axis){
    for(let i = rowOffsetP; i >= rowOffsetN; i--){
        for(let j = rowOffsetP; j >= rowOffsetN; j--){
            //check if something is there
            let p;
            switch(axis){
                case "X":p = new THREE.Vector3(rowOffsetP,i,j);  break;//set that final value  that can't be set with floor
                case "Y":p = new THREE.Vector3(i,rowOffsetN,j); break;
                case "Z":p = new THREE.Vector3(i,j,rowOffsetP);  break;
            }
            let key = getKey(p)
            if(worldDictionary.hasOwnProperty(key)){
                overlapList.push(worldDictionary[key])
            }
            createVoxel(p)
        }
    }
    //deleting them after setting them removes the new ones from the dictionary
    //deleteOverlaps()
}

let extruding = false
let extrudeStart = null
let extrudeNormal = null
//let extrudeFrom  = null
let extrudeList = []
let extrudeMouseStart = new THREE.Vector2()
let prevDelta = new THREE.Vector2()
let currDelta = new THREE.Vector2()
let prevDeltaDirection = new THREE.Vector2()
let currDeltaDirection = new THREE.Vector2()
let deltaDirectionChanged = new THREE.Vector2()
window.addEventListener('mousedown', function(event){if(event.buttons === 1){ extruding = true; }});
window.addEventListener('mouseup', function(){ extruding = false; 
                                                extrudeList = []; 
                                                extrudeStart = null; 
                                                extrudeNormal = null; 
                                                extrudeMouseStart = new THREE.Vector2();
                                                //extrudePrevious = new THREE.Vector2();
                                                prevDeltaDirection = new THREE.Vector2();
                                                currDeltaDirection = new THREE.Vector2();
                                                prevDelta = new THREE.Vector2();
                                                deltaDirectionChanged = new THREE.Vector2() });


window.addEventListener('mousedown', function(){
    //console.log("wow");
    if(myObject.mode == "Plane Extrude"){
        let hit = getHit()
        if(hit){
            extrudeNormal = hit.face.normal
            extrudeStart = hit
            extrudeMouseStart = mouse.clone()
            console.log(hit);
        }
        
    }
})

function getExtrudeDelta(){
    ///add a level counter to extrusion functions to make sure there are no skips!
    let dx = parseFloat(((mouse.x - extrudeMouseStart.x)*rowNum).toFixed(0))
    let dy = parseFloat(((mouse.y - extrudeMouseStart.y)*rowNum).toFixed(0))
    //console.log("dx: " + dx + ", " + "dy: " + dy);
    
    //do delta comparisons with previous delta
    currDeltaDirection.y = Math.sign(dy - prevDelta.y) //if we go from 1 to 2 then 2-1 is positive
    currDeltaDirection.x = Math.sign(dx - prevDelta.x)
    if(currDeltaDirection.y == 0){                               
        console.log((currDeltaDirection.y));
        //compare dirs and note changes
        deltaDirectionChanged.y = (currDeltaDirection.y != prevDeltaDirection.y) //if this direction isn't the same as last time it changed
        if(deltaDirectionChanged.y){
            ///console.log("y changed directions");
            extrudeMouseStart.y = mouse.y
            dy = parseFloat(((mouse.y - extrudeMouseStart.y)*rowNum).toFixed(0))
        }
        prevDeltaDirection.y = currDeltaDirection.y
        prevDelta.y = dy
    }

    if(currDeltaDirection.x == 0){   
        deltaDirectionChanged.x = (currDeltaDirection.x != prevDeltaDirection.x)
        if(deltaDirectionChanged.x){
            extrudeMouseStart.x = mouse.x
            dx = parseFloat(((mouse.x - extrudeMouseStart.x)*rowNum).toFixed(0))
        }
        prevDeltaDirection.x = currDeltaDirection.x
        prevDelta.x = dx
    }   
    
    return [dx,dy]
}


function Extrude(){
    if(myObject.mode == "Plane Extrude" && extruding && extrudeStart){
        let [dx,dy] = getExtrudeDelta() //get delta

        if(extrudeStart.object.geometry instanceof THREE.PlaneGeometry){
            fillPlaneExtrusion(extrudeStart.object.userData.name, extrudeStart, dx, dy)
        }
        else if(extrudeStart.object.isInstancedMesh){
            //console.log("is instanced mesh");
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

let depressing = false
window.addEventListener('mousedown', function(event){if(event.buttons === 1){ depressing = true; }});
window.addEventListener('mouseup', function(){ depressing = false; 
                                                extrudeList = []; 
                                                extrudeStart = null; 
                                                extrudeNormal = null; 
                                                extrudeMouseStart = new THREE.Vector2() });
window.addEventListener('mousedown', function(){
    //console.log("wow");
    if(myObject.mode == "Plane Impress"){
        let hit = getHit()
        if(hit){
            extrudeNormal = hit.face.normal
            extrudeStart = hit
            extrudeMouseStart = mouse.clone()
            console.log(hit);
        }
        
    }
})

function impress(){
    if(myObject.mode == "Plane Impress" && depressing && extrudeStart){
        
        if(extrudeStart.object.isInstancedMesh){
            let [dx,dy] = getExtrudeDelta()
            let axis = "X"; 
            if(Math.abs(extrudeStart.face.normal.y) > 0.5){
                axis = "Y"
            }
            else if(Math.abs(extrudeStart.face.normal.z) > 0.5){
                axis = "Z"
            }
            makePlaneImpression(axis, extrudeStart, dx, dy)
        }
    }
}

//this is a version for just removing plane blocks and it works super well 
//ideally the fillplaneextrusion would allow for both adding and removing 
//but it isn't working yet
function makePlaneImpression(axis,hit, dx,dy){

    for(let i = rowOffsetP; i >= rowOffsetN; i--){
        for(let j = rowOffsetP; j >= rowOffsetN; j--){
            let p;
            switch(axis){
                case "X":p = new THREE.Vector3(Math.ceil(hit.point.x)-0.5-dx,i,j);  break;//set that final value  that can't be set with floor
                case "Y":p = new THREE.Vector3(i,Math.floor(hit.point.y)+0.5+dy,j); break;
                case "Z":p = new THREE.Vector3(i,j,Math.floor(hit.point.z)-0.5+dx);  break;
            }
            deleteInstanceAtPosition(p)
        }
    }
    deleteOverlaps()
}

function fillPlaneExtrusion(axis,hit, dx,dy){

    //ddy and ddx are a way of skipping the first rung that teh mouse would detect 
    //so now when dy is 0 or even 1 it will still be zero
    //so we don't get the effect wqhere just clicking on teh plane creates a new plane block
    let ddy = Math.max(0.,Math.abs(dy)-1.)*Math.sign(dy)
    let ddx = Math.max(0.,Math.abs(dx)-1.)*Math.sign(dx)
    for(let i = rowOffsetP; i >= rowOffsetN; i--){
        for(let j = rowOffsetP; j >= rowOffsetN; j--){
            //check if something is there
            let p, direction;
            switch(axis){
                            //we use ceil since the values are somtimes 4.9999999 instead of 5
                case "X":direction = dx; p = new THREE.Vector3(Math.ceil(hit.point.x)-0.5-ddx,i,j);  break;//set that final value  that can't be set with floor
                case "Y":direction = dy; p = new THREE.Vector3(i,Math.floor(hit.point.y)+0.5+ddy,j); break;
                case "Z":direction = -dx; p = new THREE.Vector3(i,j,Math.floor(hit.point.z)-0.5+ddx);  break;
            }
           // console.log(p)
            let key = getKey(p)
            if(worldDictionary.hasOwnProperty(key) && worldDictionary[key]){
                overlapList.push(worldDictionary[key])
                //continue;
            }

            //as it stands this function works, but depends on the users initial click position to determine 
            if(direction > 0){// greater or equal otherwise we never draw where the cursor starts
                createVoxel(p)
            }
           else if(direction < 0){
           // console.log("deletiing/");
                deleteInstanceAtPosition(p)
            }
        }
    }
    deleteOverlaps()
}
/*
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
                case "X":p = new THREE.Vector3(rowNum/2-dx,i,j);  break;//set that final value  that can't be set with floor
                case "Y":p = new THREE.Vector3(i,-rowNum/2+dy,j); break;
                case "Z":p = new THREE.Vector3(i,j,rowNum/2+dx);  break;
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
*/

/*
//version with shifting ids in the mesh
function deleteInstance(id){
    let dummyMat = new THREE.Object3D()
    let removedMat = new THREE.Object3D()
    let dummyMatColor = new THREE.Color()
    let removedColor = new THREE.Color()
        //as you delete them the remaining cubes move down and 
        mesh.getMatrixAt(id, removedMat.matrix) //set a tmp mat to the deleted instances' matrix
        for(id; id< count-1; id++){//range from index of removed to maxCount-1
            mesh.getMatrixAt(id+1, dummyMat.matrix)
            mesh.getColorAt(id+1, dummyMatColor) //need to swap colors too or they move around as you erase!!
            //dummyMat.updateMatrix();
            mesh.setMatrixAt(id, dummyMat.matrix)
            mesh.setColorAt(id, dummyMatColor)
        }
        mesh.setMatrixAt(count-1, removedMat.matrix) //set very last instances' mat to the removed mat
        mesh.setColorAt(count-1, removedColor)
        mesh.count-- 
        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor.needsUpdate = true //and update color
}
*/


function deleteInstanceAtPosition(p){
    let p_to_farplane = p.clone()
    p_to_farplane.z += 1000
    changeVoxPosition(p, p_to_farplane)
}

function deleteInstanceAtId(id){
    let p = getInstancePositionByID(id)
    deleteInstanceAtPosition(p)
}

function deleteInstanceAtVoxel(vox){
    let p = getInstancePositionByVoxel(vox)
    deleteInstanceAtPosition(p)
}

function deleteVoxel(vox){
    if(myObject['Mesh Type']=="Three Mesh"){
        sceneList = sceneList.filter(obj => obj !== vox);
        scene.remove(vox)
        vox.material.dispose()
        let key = getKey(vox.position);//JSON.stringify(vox.position.toArray())
        delete worldDictionary[key]
    }
    else if(myObject['Mesh Type']=="Instanced"){
        /*
        //Version for shifting ids in the mesh
        let id = vox.instanceId
        let p = getInstancePosition(vox)
        let key = getKey(p)
        deleteInstance(id)
        delete worldDictionary[key]*/

        /*
        //version before adding deleteInstanceAtVox()
        let p = getInstancePosition(vox)
        let p_to_farplane = p.clone()
        p_to_farplane.z += 1000
        changeVoxPosition(p, p_to_farplane)
        */

        deleteInstanceAtVoxel(vox)

    }
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



const planeGeo = new THREE.PlaneGeometry(rowNum,rowNum,rowNum,rowNum)
const planeMat = new THREE.MeshStandardMaterial({color:"blue", wireframe: true,side: THREE.DoubleSide})
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
                    for(let p of selectedList){
                        setInstanceColor(getIdAtPostion(p), myObject.drawColor)
                    }
                    selectedList = []
                    extendSelectedList = [] 
                }
            })
/*
window.addEventListener('mouseup', function(event){
    //console.log("no hit. deselecting...up");
        if(myObject.mode == "Face Select"){
            
            
            for(let p of selectedList){
                console.log("blue");
                setInstanceColor(getIdAtPostion(p), myObject.drawColor)
            }
            for(let p of extendSelectedList){
                console.log("blue!");
                setInstanceColor(getIdAtPostion(p), myObject.drawColor)
            }
            selectedList = []
            extendSelectedList = [] 
        }
    })*/
/***************************************************************** */




window.addEventListener('mousedown', function(){
    if(myObject.mode == "Face Select"){
        selectedList = []
        let hit = getHit()
       // console.log(hit);
        if(hit){
            extrudeNormal = hit.face.normal
            extrudeStart = hit
            extruding = true
            extrudeMouseStart = mouse.clone()
            console.log(extrudeStart);
            let faceDirs = faceXDirs
            if(Math.abs(extrudeStart.face.normal.y) > 0.5){
                faceDirs = faceYDirs
            }
            else if(Math.abs(extrudeStart.face.normal.z) > 0.5){
                faceDirs = faceZDirs
            }

            faceInstancedBFS(extrudeStart, faceDirs, extrudeStart.face.normal)
        }
        
    }
})

function faceExtrude(){
 //   console.log(extrudeStart);
    if(myObject.mode == "Face Select" && 
        extruding && 
        extrudeStart && extrudeStart.object.isInstancedMesh){
        let [dx,dy] = getExtrudeDelta()

        let axis = "X";
            if(Math.abs(extrudeStart.face.normal.y) > 0.5){
                axis = "Y";
            }
            else if(Math.abs(extrudeStart.face.normal.z) > 0.5){
                //console.log(extrudeStart.face.normal.z);
                axis = "Z"; 
            }
        extrudeSelectedInstances(axis, dx, dy)
       // fillFaceExtrusion(axis, dx, dy)
    
        
    }
}
 let extendSelectedList = []

 function extrudeSelectedInstances(axis, dx, dy){

    let ddy = Math.max(0.,Math.abs(dy)-1.)*Math.sign(dy)
    let ddx = Math.max(0.,Math.abs(dx)-1.)*Math.sign(dx)
    //console.log(ddy)
     for(let p of selectedList){

        let offset, direction;
        switch(axis){
            case "X":direction = dx; offset = new THREE.Vector3(-ddx,0,0);  break;//set that final value  that can't be set with floor
            case "Y":direction = dy; offset = new THREE.Vector3(0,+ddy,0); break;
            case "Z":direction = -dx; offset = new THREE.Vector3(0,0,+ddx);  break;
        }
        let position = p.clone()
        position.add(offset)
        //console.log(position);
       /* let key = getKey(position)
        if(worldDictionary.hasOwnProperty(key) && worldDictionary[key]){
            overlapList.push(worldDictionary[key])
        }*/
        if(direction > 0){
            createVoxel(position)
        }
        else if(direction < 0){
            deleteInstanceAtPosition(p)
        }
        
        setInstanceColor(getIdAtPostion(position), myObject.selectColor)

     }
     deleteOverlaps()
     //selectedList = selectedList.concat(extendSelectedList)
    //console.log(extendSelectedList);
     //console.log(selectedList);
 }

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
/*
  window.addEventListener('mousedown', () =>
  {
    //console.log("face select");
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
*/
  window.addEventListener('mousedown', () =>
  {
    //console.log("face select");
      if(myObject.mode == "Edit"){
        let vox = getHitVoxel();

        if(vox){
            if(Math.abs(vox.face.normal.x) > 0.5){
                faceInstancedBFS(vox, faceXDirs, vox.face.normal)
            }
            else if(Math.abs(vox.face.normal.y) > 0.5){
                faceInstancedBFS(vox, faceYDirs, vox.face.normal)
            } 
            else {
                faceInstancedBFS(vox, faceZDirs, vox.face.normal)
            }  
        }
    }
  })

let selectedList = []
/*
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

*/

//exlude direction is so we don't select voxels that are actually hidden by other
//voxels on one up alone their normal direcion
function faceInstancedBFS(vox, faceDirs, excludeDir){
    console.log("bfs runs");
    let root = getInstancePositionByVoxel(vox)
    let q = [root], erg = [], visited = {}
    addToDict(visited, root)
    selectedList = []
    while(q.length){
        let akt = q.pop()
        selectedList.push(akt)
        console.log(akt);
        let id = getIdAtPostion(akt)
        setInstanceColor(id, myObject.fillColor)
        erg.push(akt)
        //selectedList.push(akt)

        for(let dir of faceDirs){ //for each cube direction
            let p = akt.clone()
            p.add(dir)
            let exclude = p.clone()
            exclude.add(excludeDir)
            if(positionInDict(worldDictionary, p) && !positionInDict(visited, p) && !positionInDict(worldDictionary, exclude)){
                q.push(p)
                addToDict(visited, p)
                
            }
        }
    }
    console.log(selectedList);
}

function getHitPos(){
    const hits = raycaster.intersectObjects(scene.children)
    //console.log(hits[0].object.isInstancedMesh);
    if(hits.length > 0){
        if(hits[0].object.geometry instanceof THREE.PlaneGeometry){
            let p = hits[0].point.clone();
            let hitPos = new THREE.Vector3(Math.floor(p.x)+0.5,Math.floor(p.y)+0.5,Math.floor(p.z)+0.5)
            //use the Vector3.floor() and Vector3.addScalar()
            switch(hits[0].object.userData.name){
                case "X":hitPos.x = rowNum/2-0.5;  break;//set that final value  that can't be set with floor
                case "Y":hitPos.y = -rowNum/2+0.5; break;
                case "Z":hitPos.z = rowNum/2-0.5;  break;
            }
        return hitPos
        }
        else if(hits[0].object.isInstancedMesh){

            let p = getInstancePositionByVoxel(hits[0])
            
            if(positionInList(p,drawList)){
                return null
            }

            let n = hits[0].face.normal.clone() 
            p.add(n)
            return p
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
        return hits[0]
    }
}

function getHitVoxel(){

    const hits = raycaster.intersectObjects(scene.children)

    if(hits.length > 0){
        if(myObject['Mesh Type'] == "Three Mesh" && 
           hits[0].object.geometry instanceof THREE.BoxGeometry){
        return hits[0]
        }
        else if(myObject['Mesh Type'] == "Instanced" && 
            hits[0].object.isInstancedMesh){
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
        if(myObject['Mesh Type'] == "Three Mesh" && hits[0].object.geometry instanceof THREE.BoxGeometry){
            
            if(eraseList.includes(hits[0].object)){
                return null
            }
            else{
                if(hits.length > 1 && hits[1].object.geometry instanceof THREE.BoxGeometry){
                    eraseList.push(hits[1].object)
                }
                return hits[0].object
            }
       }else if(myObject['Mesh Type'] == "Instanced" && hits[0].object.isInstancedMesh){
            let p1 = getInstancePositionByVoxel(hits[0])
            if(positionInList(p1,eraseList)){
                return null
            }
            else{
                if(hits.length > 1 && hits[1].object.isInstancedMesh){
                    let p2 = getInstancePositionByVoxel(hits[1])
                    eraseList.push(p2)
                }
                return hits[0]
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
    impress()
    RectSelect()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
    stats.end()
    
}

tick()
