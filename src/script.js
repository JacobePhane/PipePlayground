import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import * as dat from 'lil-gui'
import Stats from 'stats.js'

import {stats, canvas, scene, sizes, mouse, directionalLight, directionalLight2, 
    ambientLight, addResizeListener, 
    camera, controls, renderer, raycaster, gui, myObject, cameraChange, 
    boxGeo, rowNum, rowOffsetP, rowOffsetN, count, planeList} from './setup.js'

import {selectCubeRenderer, selectCubeScene} from './setup.js'

import {referenceOfGUIModes} from './setup.js'

import { Vector3 } from 'three'

    document.body.appendChild(stats.dom)
    addResizeListener()


/*

ROAD MAP:
1. Fix the box selection issue when close to end of scene
- fixed, it was camera position being too small for the scene on larger map sizes. I figured this out
when I started with 10x10x10 ->20->40 and had issues at 40 and then logged p, n and camera in selectionA
wooho that was like a 5 minute fix! DONE

2. Finish all selection modes including _C modes
- radialSelect DONE
- eraseRadialSelect DONE
- cylinderSelect (the axis thing) DONE
- eraseCylinderSelect DONE
- I might not be satisfied with the boxSelection...(later?)

(SKIPPED)
3. mod draw/erase/paint modes to add positions to list for change
- draw
- erase
- paint
- animations (later?)

4. Objects:
- add an objectlist to world dict keys with color attached to each objectname for each voxel
 remember the 1x1x1 case
- load object DONE
- move object OMG DONE

    - will be from voxel -> worlddictionary -> objectColors keys
        -> objectDictionary object -> set to objectBase DONE
        -> createObjectBox DONE
        if you overlap the underobject gets undefines and black
        FIXED
        if you click a non object voxel in move you get an error
        FIXED
        - if you use the createVoxel function it's not seen as 
        linked to an object.
        OK??
        - we have to decide if we want erased voxels to erase 
        just the first object at that position or all
        DECIDED, first 
        - what is important now is make sure if we load objects or 
        duplicate objects that we give them new names like 01,02,03
        DONE!

        NEW ISSUES:
        - if you deleteAtPosition it doesn't think about objects
        I fixed it for erase bnut I need to add that fix to 
        delete at position somehow to fix for all modes
        FIXED
        - if you use a select mode that draws over an object
        it doesn't think about objects
        FIXED
        - if you paint a voxel it changes the worldVoxel color
        but not the color of the current object
        FIXED 
            using my new setObjectColor(id, color) function in 
            3 places to fix for paint, allOfColor and paintSelection
        - draw voxels to be part of some default object
        (maybe?)
        - there really should be a currentVoxelobjectname
        - I think we'll say if there is an objectBase (selected object)
        then any erase/paint will be done to that object meaning 
        we may be removing positions from that object and updating 
        that object in the objectDictionary
        NOT USED
        - if you export a scene with multiple objects as an object
        what happends
        - Translation issue 
        FIXED
            we had an issue involving currentPosition not
            updating properly
            it turns out we were trying to update objectBase
            by setting its reference "object" to newObject
            and updating currentPosition of that. It didnt' work
            because object lost reference to objectBase in the process
            actually it might not ahave been currentPosition at all
            but that is still important for reselecting objectbox
        - I THINK WE CAN USE objectBox.position isntead of every
        using "currentPosition" as long as we toggle z with -/+ 1000
        and not just = 1000
        NOPE
            currentPosition is needed for when we have multiple
            objects! However we can do a visibility toggle
            instead of a z toggle!

        - in translateObject there is a line 
        objectDictionary[objectName] = objectBase
        I think it should be a clone of objectBase to avoid any issues
    - I still need access to the color at a voxel in the world
    dict for when there are multple objects or for when there was
    but we were left with a non object
    or something like that
    - and lists dont work for objectsAtAVoxel because so far
    multiple would get pushed. unless we can find a way around that.



- box selection to object
    - able to adjust box sides and pos before confirming
    - undo would be good here, or changing object later by 
    selecting new things
    DONE!
- duplicate object
    voxel -> worlddictionary -> objectColors keys
    -> objectDictionary object -> make a copy and add to objectDictionary
    -> load that object using the loadObject function
    -> in general if the selected object  overlapps
    another one, the objextBox should be red or blue
    DONE!
        except I don't show overlap
        I thought one object disappeared but it could have been
        the boundary thing

- rotate object
DONE HOLY SHIT!

4b) CLEAN UP THE CODE

5. Make more advanced art
- we need a way to delete objects all a once
- mute/hide selected object 
    - just delete it but leave it in the obejct dictionary
    - unmute will load it again from object Dictionary
- isolate object
    - mute/hide all objects except this one
- I can totally see boolean operations with objects now
- layers wouldn't be hard although do I need them?

6. create the shadertoy of voxel art with 10,20,40,and 80 scene sizes(?) totally another
project that needs to be broken down into MVPs etc
*/


//erase cylinder doesn't work from above?

//erase selection works but if you use a plane it can't select anything. You have to select
//a voxel face which at minimum is one level above a plane. Maybe this is ok

//With a box of voxels that takes up almost the full scene
//the erase voxels function is unpredictable
//sometimes it creates rectangles that aren't in the plane 
//and the erasing affects the other side of teh scene.

//erase selection doens't work as expected when the selected surface is too close
//too the edge of the scene...

//look into this line: mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
//we may not need it all over the codebase like we have it now

//document.addEventListener('mousedown', setToLowQuality);
//document.addEventListener('mouseup', setToHighQuality);
function setToLowQuality(event) {
  if (event.button === 2) {
    directionalLight.visible = false
    directionalLight2.visible = false
    directionalLight.castShadow = false
    directionalLight2.castShadow = false
    mesh.receiveShadow = false
    renderer.shadowMap.enabled = false
    mesh.visible = false
    //mesh.material = new THREE.MeshStandardMaterial()
  }
}

function setToHighQuality(event) {
    if (event.button === 2) {
      directionalLight.visible = true
      directionalLight2.visible = true
      directionalLight.castShadow = true
      directionalLight2.castShadow = true
      mesh.receiveShadow = true
      //mesh.material = new THREE.MeshBasicMaterial()
      renderer.shadowMap.enabled = true
      mesh.visible = true
    }
  }
/*
*
* BUILD WORLD MESH
*
*/

const image = new Image()
const loadingManager = new THREE.LoadingManager()
loadingManager.onStart = () =>
{
    //console.log('texture loading started')
}
loadingManager.onLoad = () =>
{
    //console.log('texture loaded')
}
loadingManager.onProgress = () =>
{
    //console.log('texture loading....')
}
loadingManager.onError= () =>
{
    //console.log('texture loading error')
}

const textureLoader = new THREE.TextureLoader(loadingManager)
const colorTexture = textureLoader.load('/textures/Sci_fi_Metal_Panel_002_SD/Sci_fi_Metal_Panel_002_basecolor.jpg');
const heightTexture = textureLoader.load('/textures/Sci_fi_Metal_Panel_002_SD/Sci_fi_Metal_Panel_002_height.png');
const normalTexture = textureLoader.load('/textures/Sci_fi_Metal_Panel_002_SD/Sci_fi_Metal_Panel_002_normal.jpg');
const ambientOcclusionTexture = textureLoader.load('/textures/Sci_fi_Metal_Panel_002_SD/Sci_fi_Metal_Panel_002_ambientOcclusion.jpg');
const roughnessTexture = textureLoader.load('/textures/Sci_fi_Metal_Panel_002_SD/Sci_fi_Metal_Panel_002_roughness.jpg');
let textureScale = new THREE.Vector2(0.25,0.25)
normalTexture.repeat = colorTexture.repeat = heightTexture.repeat = 
normalTexture.repeat = ambientOcclusionTexture.repeat = textureScale

const geometry = new THREE.BoxGeometry(1, 1, 1);
geometry.computeVertexNormals();
geometry.setAttribute('uv2', geometry.attributes.uv.clone());

let material = new THREE.MeshStandardMaterial({
  // map:colorTexture,
    heightMap: heightTexture, 
    normalMap:normalTexture,
    roughnessMap:roughnessTexture, 
    aoMap:ambientOcclusionTexture 
})

material.metalness = 0.0
material.normalScale = new THREE.Vector2(2,2)

const mesh = new THREE.InstancedMesh(geometry, material, count);
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
mesh.count = 0
mesh.receiveShadow = true
mesh.castShadow = true
scene.add(mesh);
let uiVoxelCount = 0
//mesh.matrixAutoUpdate = false

  

function createNewObject(name){
    let newObject = {}
    newObject["type"] = "object"
    newObject["name"] = name
    newObject["currentPosition"] = new THREE.Vector3(0,0,0)
    newObject["positions"] = {}
    newObject["dimentions"] = {"width":rowNum,
                               "height":rowNum,
                               "depth":rowNum }
    return newObject
}

function createTestObject(){
    let newObject = createNewObject("test")
    for ( let x = rowOffsetN; x <= rowOffsetP; x ++ ) {
        for ( let y = rowOffsetN; y <= rowOffsetP; y ++ ) {
            for ( let z = rowOffsetN; z <= rowOffsetP; z ++ ) {
                let p = new THREE.Vector3(x,y,z)
                newObject["positions"][getKey(p)] = {"color": 255}
            }
        }
    }
    return newObject
}

//CREATE TEST OBJECT
let objectBase = null;//createTestObject()

//OBJECT DICTIONARY
let objectDictionary = {}

//WORLD DICTIONARY
let worldDictionary = {}

//PROJECT STRUCTURE SET UP
let project = {}
project["type"] = "project"
project["name"] = "some_name"
project["worldDictionary"] = worldDictionary
project["objectDictionary"] = objectDictionary
project["dimentions"] = {"width":rowNum,
                               "height":rowNum,
                               "depth":rowNum }

/*
Later:
we call fillworld:
- loads/inits mesh per voxel as farplane, mesh.count++
- loads/inits worldDictionary per voxel as count 0

We call loadObject:
- sets mesh per voxel
- sets worldDictionary per voxel
- sets worldDictionary per voxel as count 0
- loads objectDictionary["name"] = object
/*


*
* UTILIY FUNCTIONS
*
*/

function cloneObject(object){
    let clone = JSON.parse(JSON.stringify(object));
    let o = clone["currentPosition"]
    clone["currentPosition"] = new THREE.Vector3(o.x,o.y,o.z)
    return clone
}

function cloneDictionary(d){
    return JSON.parse(JSON.stringify(d));
}

function getKey(p){
    return JSON.stringify(p.toArray())
}

function positionInDict(dict, p){
    let key = getKey(p)
    return dict.hasOwnProperty(key)
}

function positionInList(p, list){
    return list.some(item => item.equals(p));
 }
 
 function removeFromList(list, element) {
    return list.filter(item => item !== element);
}

 function positionActive(p){
     return positionInList(p, activeList)
 }

function getIdAtPostion(p){
    if(positionInDict(worldDictionary,p)){
        return worldDictionary[getKey(p)]["id"]
    }
    return undefined
}

function getColorAtPostion(p){
    if(positionInDict(worldDictionary,p)){
        return worldDictionary[getKey(p)]["color"]
    }
    return undefined
}

function getVoxelCountAtPostion(p){
    if(positionInDict(worldDictionary,p)){
        return worldDictionary[getKey(p)]["count"]
    }
}

function addToDict(dict, p){
    dict[getKey(p)] = getIdAtPostion(p)
}

function getKeyList(dict){
    return Object.keys(dict)
}

function getNextKey(dict){
    let keyList = Object.keys(dict)
    return keyList.length ? keyList[0] : null
}

function getDummyWithP(p){
    let dmy = new THREE.Object3D()
    dmy.position.set( p.x, p.y, p.z );
    dmy.updateMatrix();
    return dmy
}

function getPositionMatrix(p){
    let matrix = new THREE.Matrix4();
    matrix.setPosition(new THREE.Vector3(p.x, p.y, p.z));
    return matrix
}

function checkMatchingVector3(a, b){
    return (a.x==b.x && a.y == b.y && a.z == b.z)
}

function checkNotMatchingVector3(a,b){
    return (a.x != b.x || a.y != b.y || a.z != b.z)
}

function isPlane(hit){
    return hit.object.geometry instanceof THREE.PlaneGeometry
}

function isInstance(hit){
    return hit.object.isInstancedMesh
}

function stringToVector3(vectorString){
    return new THREE.Vector3(...JSON.parse(vectorString))
}

function sortPairAscending(a,b){
    let tmp = a;
    if(b<a){a = b; b = tmp}

    return [a,b]
}

function midPoint(a,b){
    return (a+b)/2
}

/*
* NORMAL HELPER FUNCTIONS
*/

function addToBByNormal(n,a,b,y){
    let normal = n.clone()
    b.x = Math.abs(normal.x) > 0.5 ? a.x + y*normal.x: b.x
    b.y = Math.abs(normal.y) > 0.5 ? a.y + y*normal.y : b.y
    b.z = Math.abs(normal.z) > 0.5 ? a.z + y*normal.z: b.z
    return b
}
function addToBByNotNormal(n,a,off){
    let normal = n.clone()
    a.x = Math.abs(normal.x) < 0.5 ? a.x + off: a.x
    a.y = Math.abs(normal.y) < 0.5 ? a.y + off: a.y
    a.z = Math.abs(normal.z) < 0.5 ? a.z + off: a.z
    return a
}
function setAToBByNormalMask(n,a,b){
    let normal = n.clone()
    b.x = Math.abs(normal.x) > 0.5 ? a.x : b.x
    b.y = Math.abs(normal.y) > 0.5 ? a.y : b.y
    b.z = Math.abs(normal.z) > 0.5 ? a.z : b.z
    return b
}

function setPlaneXYByNormal(n,x,y,a,b){
    let cr = camera.rotation
    if(Math.abs(n.x) > 0.5){
        if(cr.z >= 0){
            b.y = a.y+y; b.z = a.z-x;b.x=a.x;
        }
        else{
            b.y = a.y+y; b.z = a.z+x;b.x=a.x;
        }
    }
    else if(Math.abs(n.y) > 0.5){
        //(Math.abs(cr.z) > Math.PI-Math.PI/4)
        if(cr.z > -(Math.PI-Math.PI/4) && cr.z < -Math.PI/4){
            b.x = a.x+y; b.z = a.z+x;b.y=a.y
        }
        else if(Math.abs(cr.z) < Math.PI/4){
            b.x = a.x+x; b.z = a.z-y;b.y=a.y
        }
        else if(cr.z > Math.PI/4 && cr.z < (Math.PI-Math.PI/4)){
            b.x = a.x-y; b.z = a.z-x;b.y=a.y
        }
        else{
            b.x = a.x-x; b.z = a.z+y;b.y=a.y
        }
    }
    else{
        if(Math.abs(cr.z) < Math.PI/2){
            b.x = a.x+x; b.y = a.y+y;b.z=a.z
        }
        else{
            b.x = a.x-x; b.y = a.y+y;b.z=a.z
        }
    }
    return b
}

function getNormalByAxis(axis){
    switch(axis){
        case "X":return new THREE.Vector3(-1.,0.,0.);//set that value that floor can't
        case "Y":return new THREE.Vector3(0.,1.,0.);
        case "Z":return new THREE.Vector3(0.,0.,-1.);
    }
}

function getPlaneFromNormal(n,p){
    let v2 = new THREE.Vector2()
    if(n.x != 0){v2.x = p.y; v2.y = p.z}
    else if(n.y != 0){v2.x = p.x; v2.y = p.z}
    else{v2.x = p.x; v2.y = p.y}
    return v2
}

function getAntiNormal(n){
    let I = new THREE.Vector3(1,1,1)
    let A = new THREE.Vector3(
                Math.abs(n.x),
                Math.abs(n.y),
                Math.abs(n.z))
    return I.sub(A)
}

//MOUSE DELTA 
function getMouseDelta(x,y){
    let dx = parseFloat(((mouse.x - x)*rowNum*2.).toFixed(0))
    let dy = parseFloat(((mouse.y - y)*rowNum*2.).toFixed(0))
    return [dx,dy]
}

/*
*
* MESH CRUD FUNCTIONS
*
*/  

/* 
sets color in:
- worldDictionary
- worldDictionary objectList 
- and the object
*/
function setObjectColor(id, color){
    let p = getInstancePositionByID(id)
    let worldVox = worldDictionary[getKey(p)]
    if(worldVox){
        worldVox["color"] = color
        let object = getFirstObjectVoxelKey(p)
        if(object){
            let name = object["name"]
            objectDictionary[name]["positions"][getKey(p)] = color
            //to comment out
            //worldVox["objectColors"][name] = color
           //worldVox["objectsHere"]
        }
    }
}

function setInstanceColor(id, color){
    
    let co = new THREE.Color()
    co.setHex(color)
    mesh.setColorAt(id, co)
    mesh.instanceColor.needsUpdate = true
}

function paintInstanceByPosition(p){
    let id = getIdAtPostion(p)
    setInstanceColor(id, myObject.paintColor)
    setObjectColor(id, myObject.paintColor)
    
}

function getFarplaneP(p){
    let farP = p.clone()
    farP.z += 1000
    return farP
}

//because we delete keys and add new keys we don't preserve order
//and we would have to actually change the key in the same place
//to preserve order..?
function changeVoxPosition(p, keyPos, inc){
    //let dmy = getDummyWithP(p)
    
    let id = getIdAtPostion(keyPos)
    let matrix = getPositionMatrix(p)
    mesh.setMatrixAt(id, matrix);//dmy.matrix
    setInstanceColor(id, myObject.drawColor)
    let worldVox = worldDictionary[getKey(keyPos)]
    //Do we need this if we do it in setInstanceColor???
    if(inc > 0){ //inc is 1 if creating and 0 if deleting, for now
        worldVox["color"] = myObject.drawColor
    }
    else{
        //set the color to the next object 
    }
    worldVox["count"] += inc
    mesh.instanceMatrix.needsUpdate = true
    renderer.shadowMap.needsUpdate = true
}

function createVoxel(p){
    //we need to filter out plane hits from behind
    let object = objectBase//getFirstObjectVoxelKey(p)
    let name = object ? object["name"] : null
    let worldVox = worldDictionary[getKey(p)]
    if(!worldVox || worldVox["count"] > 0){return}//dont stack
    let color = myObject.drawColor
    loadObjectVoxel(p, name, color)

    //whattt???
    /*if(object){
        delete object["positions"][getKey(p)]
        objectDictionary[object["name"]] = object
    }*/


    /*//old version
    let worldVox = worldDictionary[getKey(p)]
    if(worldVox && worldVox["count"] < 1){
        changeVoxPosition(p, p, 1)
        uiVoxelCount++
    }*/
}

function deleteInstanceAtPosition(p){
    let object = getFirstObjectVoxelKey(p)
    let name = object ? object["name"] : null
    let worldVox = worldDictionary[getKey(p)]
    if(!worldVox || worldVox["count"] == 0){return}//dont dig
    deleteObjectVoxel(p, name)
    if(object){
        delete object["positions"][getKey(p)]
        objectDictionary[object["name"]] = object
    }
    /*//old version
    if(positionInDict(worldDictionary,p)){
        changeVoxPosition(getFarplaneP(p), p, -1)
        uiVoxelCount--
    }*/
}

function deleteInstanceAtId(id){
    let p = getInstancePositionByID(id)
    deleteInstanceAtPosition(p)
}

function deleteInstanceAtVoxel(vox){
    let p = getInstancePositionByVoxel(vox)
    deleteInstanceAtPosition(p)
}

/*
*
* MESH SETUP FUNCTIONS
*
*/ 

function initVoxel(p, key, color, inc){
    //let dmy = getDummyWithP(p)
    let matrix = getPositionMatrix(p)
    //mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    mesh.setMatrixAt(mesh.count, matrix)//dmy.matrix
    worldDictionary[key] = {}
    worldDictionary[key]["id"] = mesh.count
    worldDictionary[key]["color"] = color
    worldDictionary[key]["count"] = inc
    //worldDictionary[key]["objectColors"] = {}
    worldDictionary[key]["objectsHere"] = {}
    setInstanceColor(mesh.count, color)
    mesh.count++ 
    mesh.instanceMatrix.needsUpdate = true 
}

function loadFarVoxel(p, color){
    initVoxel(getFarplaneP(p), getKey(p), color, 0)
}

function loadSavedVoxel(p, savedVoxel){
    let color = savedVoxel["color"] ?? myObject.drawColor
    let pWorld = p.clone()
    let inc = 1
    if(savedVoxel["count"] < 1){
        pWorld.z += 1000
        inc = 0
    }
    else{
        uiVoxelCount++
    }
    loadVoxel(pWorld, getKey(p), color, inc)
}

//LOAD PROJECT
function loadSaved(data){
    mesh.count = 0 //reset mesh count
    worldDictionary = {} //reset world dict
    for(let key in data){
        let p = stringToVector3(key)
        loadSavedVoxel(p, data[key])
    }
    renderer.shadowMap.needsUpdate = true
    renderer.render(scene, camera)
}

function handleFileSelection(file) {
    if (file){
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const data = JSON.parse(content);

            if(data.hasOwnProperty("type") && data["type"] == "object"){
                loadObject(data)
            }
            else if(data.hasOwnProperty("type") && data["type"] == "project"){
                loadProject(data)
            }
            else{
                loadSaved(data)
            }
        };
        reader.readAsText(file);//this does the loading then?
    }
}

document.getElementById('import_data').addEventListener('click', importData);
let inputElement = null
function importData() {
    //due to some security thing you can only access a file input once
    //so we recreate it each time to get away from this issue
    inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = ".ypro, .yobj"
    inputElement.onchange = function(){
        let file = inputElement.files[0]
        if(file){
            handleFileSelection(file)
        }
};
    inputElement.click();
}


//IMPORT OBJECT //just repeat importData since it handels both cases
document.getElementById('import_object').addEventListener('click', importData);


//SAVE PROJECT
var a = document.createElement("a");
document.getElementById('save_data').addEventListener('click', saveProject);

function saveProject(){
    //let content = worldDictionary
    const name = (prompt('Enter a file name', 'savedProject'))
    const fileName = name + '.ypro';
    let projectData = {}
    projectData["type"] = "project"
    projectData["name"] = name
    projectData["worldDictionary"] = worldDictionary
    projectData["objectDictionary"] = objectDictionary
    projectData["dimentions"] = {"width":rowNum,
                                 "height":rowNum,
                                 "depth":rowNum 
                                }
    
    let contentType = 'text/plain'
    const jsonString = JSON.stringify(projectData);//(content);
    var file = new Blob([jsonString], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function worldToObject(name){
    let newObject = createNewObject(name)
    for ( let x = rowOffsetN; x <= rowOffsetP; x ++ ) {
        for ( let y = rowOffsetN; y <= rowOffsetP; y ++ ) {
            for ( let z = rowOffsetN; z <= rowOffsetP; z ++ ) {
                let p = new THREE.Vector3(x,y,z)
                let key = getKey(p)
                if( worldDictionary[key]["count"] > 0){
                    newObject["positions"][key] = worldDictionary[key]["color"]
                }
            }
        }
    }
    return newObject
}


//EXPORT OBJECT
document.getElementById('export_object').addEventListener('click', exportObject);

/*
If we are exporting a selection as object:
- Content is in objectBase

If we export the world as an object then in worldToObject():
- create an object using createNewObject(name) 
- then in the newObjects positions attribue
set each key to worldDictionary[key]["color"] 

*/
function exportObject(){
    const name = (prompt('Enter a file name', 'savedObject'))
    const fileName = name + '.yobj';
    //either selected object or the whole project as object
    let content =  objectBase || worldToObject(name)
    let contentType = 'text/plain'
    const jsonString = JSON.stringify(content);
    var file = new Blob([jsonString], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

//FILL WORLD
function fillWorld(){
    for ( let x = rowOffsetN; x <= rowOffsetP; x ++ ) {
        for ( let y = rowOffsetN; y <= rowOffsetP; y ++ ) {
            for ( let z = rowOffsetN; z <= rowOffsetP; z ++ ) {
                let p = new THREE.Vector3(x,y,z)
                loadFarVoxel(p, myObject.drawColor)
            }
        }
    }
    mesh.instanceMatrix.needsUpdate = true;
    uiVoxelCount = 0//loadVoxel adds to this so we reset it (but I commeted out the add anyway)
}

//CLEAR PROJECT
document.getElementById('clear_data').addEventListener('click', clearProject);
function clearProject(){
    mesh.count = 0 //reset mesh count
    worldDictionary = {} //reset world dict
    fillWorld()
    renderer.render(scene,camera)
}

function deleteObjectVoxel(p, objectName){
    if(positionInDict(worldDictionary, p)){
        let key = getKey(p)
        let worldVoxel = worldDictionary[key]
         if(objectName){
            //if it's an object delete it's name from the voxel
           //delete worldVoxel["objectColors"][objectName]
            //remove last added object name doesnt work if thats not the one we  aremoving
            //worldVoxel["objectsHere"].pop()
           // removeFromList(worldVoxel["objectsHere"],objectName)
           delete worldVoxel["objectsHere"][objectName]
        }

        worldVoxel["count"]--
        let id = getIdAtPostion(p)
        //if that was the last voxel set mesh to farplane
        if(worldVoxel["count"] == 0){
            let matrix = getPositionMatrix(getFarplaneP(p))
            mesh.setMatrixAt(id, matrix);
            uiVoxelCount--
            //color doesn't matter then
        }
        else{
            //else, more object voxels there mean more keys
             //to delete
           // let objectNames = Object.keys(worldVoxel["objectColors"])
             //to delete
           // let nextColor = worldVoxel["objectColors"][objectNames[0]] 
            //                ?? 16777215
            
            let objectsHere = Object.keys(worldVoxel["objectsHere"])
            let name = objectsHere[objectsHere.length-1]
            //console.log(cloneObject(objectDictionary[name]));
            let nextColor = objectDictionary[name]["positions"][getKey(p)]
            
            worldVoxel["color"] = nextColor  //set next color in world
            
            setInstanceColor(id, nextColor)  //and in mesh
            //it also delets color from worldDictionary object colors
            //and updates the worldDictionar color if nessesary
            //the p of the object is deleted so no color to set there
            
        }
        mesh.instanceMatrix.needsUpdate = true
        renderer.shadowMap.needsUpdate = true
    }
}

function loadObjectVoxel(p, objectName, color){
    if(positionInDict(worldDictionary, p)){
        let key = getKey(p)
        let worldVoxel = worldDictionary[key]

        
        if(objectName){   
            //to delete
           // worldVoxel["objectColors"][objectName] = color

            //worldVoxel["objectsHere"].push(objectName)
            worldVoxel["objectsHere"][objectName] = null
        }

        worldVoxel["color"] = color
        worldVoxel["count"]++
        let id = getIdAtPostion(p)
        //if it was 0 before and now 1
        if(worldVoxel["count"] == 1){
            let matrix = getPositionMatrix(p)
            mesh.setMatrixAt(id, matrix);
            uiVoxelCount++
        }
        setInstanceColor(id, color)
        //it also sets color for worldDictionary
        //and it's object color list
        //the object itself already holds it's colors
        mesh.instanceMatrix.needsUpdate = true
        renderer.shadowMap.needsUpdate = true
    }
}

function loadWorldVoxel(worldVoxel, p){
    //we probably don't need this if statement
    if(positionInDict(worldDictionary, p)){
        let id = getIdAtPostion(p)
        //worldVoxel = worldDictionary[key] 
        //we set it in the mesh if count > 0
        if(worldVoxel["count"] > 0){
            let matrix = getPositionMatrix(p)
            mesh.setMatrixAt(id, matrix);
            uiVoxelCount++
        }
        setInstanceColor(id, worldVoxel["color"])
    }
}


const objectBoxGeo = new THREE.BoxGeometry(1,1,1);
const objectBoxMat = new THREE.MeshStandardMaterial(    
                            {color:"0xffffff", 
                            transparent: true, 
                            opacity: 0.2, 
                            depthTest: true })
const objectBox = new THREE.Mesh(objectBoxGeo, objectBoxMat)
objectBox.position.z = 1000;

selectCubeScene.add(objectBox) 

function createObjectBox(dims,p){
    objectBox.scale.set(dims["width"],dims["height"],dims["depth"])
    objectBox.position.set(p.x,p.y,p.z);
    objectBox.material.visible = true
    //render last
    selectCubeRenderer.render(selectCubeScene,camera)
    
}

function NumberFromName(name){
    let number = null;
    for (let i = name.length - 1; i >= 0; i--) {
        const ch = name.charAt(i);
        if(!isNaN(ch)){
            number = ch + number
        }
        else{
            break
        }
    }
    return parseInt(number)
}
function restOfName(name){
    for (let i = name.length - 1; i >= 0; i--) {
        const ch = name.charAt(i);
        if(isNaN(ch)){
            return name.slice(0,i+1)
        }
    }
    return name
}
function generateObjectName(name){
    if(objectDictionary.hasOwnProperty(name)){
        let num = NumberFromName(name) || 1 //the coalesing operator(??) wont 
        name = restOfName(name)
        //see the empty string as null/undefined but (||) works!
        let finalName = null
        while(!finalName){
            let testName = name + num.toString()
            if(!objectDictionary.hasOwnProperty(testName)){
                finalName = testName;
            }
            num++
        }
        return finalName
    }
    else{
        return name
    }
}

/*
If we load an object we assume there is already a 
world dictionary so in "loadObjectVoxel" we need to:
- update worldDictionary voxel color for each object voxel p
- update worldDictionary voxel count for each object voxel p
- update the mesh for each objectVoxel
- we also set the object name
*/
function loadObject(object){
    object["name"] = generateObjectName(object["name"])
    let objectName = object["name"]
   // console.log(objectName);
    //if this object doens't have a position give it one
    
    if(object.hasOwnProperty("currentPosition")){
        let o = object["currentPosition"] 
        //the vector in json loses the threejsness
        //so we need to get it back so we can use .add() later
        object["currentPosition"] = new THREE.Vector3(o.x,o.y,o.z)
    }
    else{
        object["currentPosition"] = new THREE.Vector3(0,0,0)
    }
    objectDictionary[objectName] = object
    objectBase = object
    let data = object["positions"]

    //set mesh and worldDictionary
    for(let key in data){
        let p = stringToVector3(key)
        let color = data[key]
        loadObjectVoxel(p, objectName, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    renderer.shadowMap.needsUpdate = true
    //time out needed for the render to work after load
    setTimeout(function() {
        renderer.render(scene, camera)
      }, 300);
    createObjectBox(objectBase["dimentions"],objectBase["currentPosition"])
    referenceOfGUIModes.setValue("Move")
}

/*
If we load a whole project then in "loadWorldVoxel"
we need to:
- load objectDictioanry to global
- load worldDictionary to global
- for each worldDictionary[key], if count > 0 set p in mesh
*/
function loadProject(projectData){
    project["name"] = projectData["name"]
    worldDictionary = projectData["worldDictionary"]
    objectDictionary = projectData["objectDictionary"]
    for(let key in worldDictionary){
        let p = stringToVector3(key)
        loadWorldVoxel(worldDictionary[key], p)
    }
    //remake the three vectors
    for(let key in objectDictionary){
        let o = objectDictionary[key]["currentPosition"] 
        objectDictionary[key]["currentPosition"] = new THREE.Vector3(o.x,o.y,o.z)
    }
    mesh.instanceMatrix.needsUpdate = true
    renderer.shadowMap.needsUpdate = true
    //time out needed for the render to work after load
    setTimeout(function() {
        renderer.render(scene, camera)
      }, 300);
}



// addEventListener
/*
*
* GET INSTANCE POSITION FUNCTIONS (MESH) By ID, By Voxel/hit
*
*/

function getInstancePositionByID(id){
    let p = new THREE.Vector3()
    let mat = new THREE.Matrix4()
    mesh.getMatrixAt(id, mat)    
    p.setFromMatrixPosition(mat)
    return p
}

function getInstancePositionByVoxel(vox){
    let p = new THREE.Vector3()
    let i = vox.instanceId
    let mat = new THREE.Matrix4()
    mesh.getMatrixAt(i, mat)    
    p.setFromMatrixPosition(mat)
    return p
}



/*
*
* GET HIT POSITION FUNCTIONS (RAYCAST) PLANE, ANY
*
*/

function getPlaneHitPosition(hit){
    let p = hit.point.clone();
    let hitPos = p.floor().addScalar(0.5)
    switch(hit.object.userData.name){
        case "X":hitPos.x = rowOffsetP;  break;//set that value that floor can't
        case "Y":hitPos.y = rowOffsetN;  break;
        case "Z":hitPos.z = rowOffsetP;  break;
    }
    return hitPos
}

function getAnyHitPosition(hit){
    if(hit){
        if(hit.object.geometry instanceof THREE.PlaneGeometry){
            return getPlaneHitPosition(hit)
        }
        else{
            let p = getInstancePositionByVoxel(hit)
            if(!positionActive(p)){
                return p.add(hit.face.normal.clone())
            }
        }
    }
    return null
}

function getPlaneHitNormal(hit){
    let axis = hit.object.userData.name
    return getNormalByAxis(axis)
}

function getAnyNormal(hit){
    if(hit.object.geometry instanceof THREE.PlaneGeometry){
        return getPlaneHitNormal(hit)
    }
    else{
        return hit.face.normal
    }
}


/*
*
* GET HIT FUNCTIONS (ALWAYS RAYCAST) PLANE, VOXEL, ANY
*
*/


function getAnyHit(){
    const hits = raycaster.intersectObjects(scene.children)
    if(hits.length > 0){
        return hits[0]
    }
    return null
}

function getHitPlane(){
    const hits = raycaster.intersectObjects(planeList)
    if(hits.length > 0 && hits[0].object.geometry instanceof THREE.PlaneGeometry){
        return hits[0]
    }
    return null
}

function getHitVoxel(){
    const hits = raycaster.intersectObject(mesh)
    if(hits.length > 0){
        if(hits[0].object.isInstancedMesh){
            return hits[0]
        }
    }
    return null
}

function getFirstInstanceHit(){
    const hits = raycaster.intersectObject(mesh)
    if(hits.length > 0){
        return hits[0]
    }
    return null
}

function getFirstHit(){
    let testList = [...planeList,...[mesh]]
    let minDist = 10000
    let first = null
    for(let test of testList){
        let hit = raycaster.intersectObject(test)
        if(hit[0] && hit[0].distance < minDist){
            minDist = hit[0].distance
            first = hit[0]
        }
    }
    return first
}

function getNotSelectionBoxHit(){
    let hits = raycaster.intersectObjects(scene.children)
    for(let hit of hits){
        if(isPlane(hit) || isInstance(hit)){
            return hit
        }    
    }
    return null
}

function getNotActiveVoxelPosition(){
    const hits = raycaster.intersectObjects(scene.children)
        if(hits[0] && hits[0].object.isInstancedMesh){
            let p = getInstancePositionByVoxel(hits[0])
            if(!positionActive(p)){
                if(hits[1] && hits[1].object.isInstancedMesh)
                    {
                        let p2 = getInstancePositionByVoxel(hits[1])
                        activeList.push(p2)
                    }
                return p
            }
        }
    return null
}

/*
function closestHit(list){
    let minHit = null
    let minDist = 100000
    for(let hit of list){
        if(hit && hit.distance < minDist)
        {
            minHit = hit
            minDist = hit.distance
        }
    }
    return minHit
}
*/

/*
function getSelectionHitB(){
    let hitI = getFirstInstanceHit() 
    let hitP = getHitPlane()// getNotSelectionBoxHit() //
    let hit = closestHit([hitI,hitP]) //getFirstHit();//

    if(!hit){return null}
    let p = getAnyHitPosition(hit)
    let n = getAnyNormal(hit)
    
    if(p && n){
        p = setAToBByNormalMask(n,activeList[0],p)
        if( checkMatchingVector3(activeList[0], p) || 
            !checkMatchingVector3(activeList[1], n)){
            return null
        }

        activeList[2] = p //we dont' need to check list length
        activeList[3] = n //I'm using the second copy of n for movements along the normal 
        //like in the createSphere and radialSelect. It's messy for sure.
        

    }   
    return p
}
*/

function getSelectionHitA(){
    let hit = getAnyHit() //getFirstHit();//
    if(!hit){return null}
    if(!isPlane(hit) && !isInstance(hit)){
        return null //if it's the selection box
    }
    let p = getAnyHitPosition(hit)
    let n = getAnyNormal(hit)
    if(p && n){
        activeList.push(p)
        activeList.push(n)
    }
    return p
}
//We now set mouseStart in the general mousedown listener so we can use mousedelta here
//getMouseDelta now returns x and y every time
//we use setPlaneXYByNormal here to set the second p value based on camera.rotation.z
//as well as normal 

function getSelectionHitB2(){
    let [x,y] = getMouseDelta(mouseStart.x, mouseStart.y)
    let n = activeList[1]
    let p1 = activeList[0]
    let p2 = new THREE.Vector3()

    /*let I = new THREE.Vector3(1,1,1)
    let absN = new THREE.Vector3(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z))
    let notN = I.sub(absN)*/
    p2 = setPlaneXYByNormal(n,x,y,p1,p2)
    activeList[2] = p2
    activeList[3] = n
    return p2
}

//the addToBByNormal now flips the sign of y based on the normal sign
function getSelectionHitC(){
    let [x,y] = getMouseDelta(mouseStart.x, mouseStart.y)
    addToBByNormal(activeList[1],activeList[2],activeList[0],y)
}

function getSphereSelectionHitC(){
    let [x,y] = getMouseDelta(mouseStart.x, mouseStart.y)
    let n = activeList[1].clone()
    activeList[3] = n.multiplyScalar(y) //second copy of n in activeList[3] stores the y
             //based on normal   a(normal) + y = b(normal2)
    //addToBByNormal(activeList[1],activeList[1],activeList[3],y)
}

function getCylinderSelectionHitC(){
    let [x,y] = getMouseDelta(mouseStart.x, mouseStart.y)
    let n = activeList[1].clone()
    activeList[3] = n.multiplyScalar(y) //second copy of n in activeList[3] stores the y
    //addToBByNormal(activeList[1],activeList[1],activeList[3],y)
}

function getFirstObjectVoxelKey(p){
    //not really "first" though
    // get the worldvoxel at that position
    let worldVox = worldDictionary[getKey(p)]
    if(worldVox){
        //get the objectColors dictionary there
       // let ocd = worldVox["objectColors"]
        let objectsHere = Object.keys(worldVox["objectsHere"])
        //get the first key if there are keys
        //let key = getNextKey(ocd)
        let key = objectsHere.length > 0 ? 
                  objectsHere[objectsHere.length-1] : 
                  null
        if(key){//if it's just a world voxel it doesn't have an object
            //get object in objectDictionary
            let newObject = objectDictionary[key]
            //set objectBase to new Object
            return newObject
        }
        else{
            return null
        }

    }
    else{
        return null
    }
    
}
/*
*
* MODE FUNCTIONS
*
*/

let currentMode = "Idle"
let activeList = []
window.addEventListener('mousedown', function(event){if(event.buttons === 1){currentMode = myObject.mode;mouseStart = mouse.clone()}});
window.addEventListener('mouseup', function(){currentMode = "Idle"; modeOnMouseUp(); activeList = []});
window.addEventListener('mousedown', function(event){if(event.buttons === 3){mouseStart = mouse.clone();currentMode += "_B";}});


//ON END OF A MODE
function modeOnMouseUp(){
    switch (myObject.mode) {
        case "Select":
            selectOnEnd()//selectOnEnd()
            break;
        case "Erase Selection":
            eraseSelectionOnEnd()
            break;
        case "Paint Selection":
            paintSelectionOnEnd()
            break;
        case "Radial Select":
            radialSelectOnEnd()//selectOnEnd()
            break;
        case "Erase Radial Selection":
            eraseRadialSelectionOnEnd()
            break;
        case "Cylinder Select":
            cylinderSelectOnEnd()
            break;
        case "Erase Cylinder Selection":
            eraseCylinderSelectOnEnd()
            break;
        case "Move":
            MoveOnEnd()
            break;
        case "To Object":
            boxSelectAsObjectOnEnd()
            break;
        default:
            break;
    }
    renderer.render(scene, camera)
}

//ON END FUNCTIONS
function selectOnEnd(){
    if(activeList.length == 4){
        if(myObject.mode == "Select"){//later it should be "Select->Create" mode
            fromSelection(createVoxel,activeList[0],activeList[2])
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    selectCube.position.z = 1000
    selectCubeRenderer.render(selectCubeScene, camera)
}

function eraseSelectionOnEnd(){
    if(activeList.length == 4){
        if(myObject.mode == "Erase Selection"){//later it should be "Select->Create" mode
            let p1 = activeList[0].sub(activeList[1])
            let p2 = activeList[2].sub(activeList[1])
            fromSelection(deleteInstanceAtPosition,p1,p2)
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    selectCube.position.z = 1000
    selectCubeRenderer.render(selectCubeScene, camera)
}

function paintSelectionOnEnd(){
    if(activeList.length == 4){
        if(myObject.mode == "Paint Selection"){//later it should be "Select->Create" mode
            let p1 = activeList[0].sub(activeList[1])
            let p2 = activeList[2].sub(activeList[1])
            fromSelection(paintInstanceByPosition,p1,p2)
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    selectCube.position.z = 1000
    selectCubeRenderer.render(selectCubeScene, camera)
}

function radialSelectOnEnd(){
    if(activeList.length == 4){
        if(myObject.mode == "Radial Select"){//later it should be "Select->Create" mode
            let p1 = activeList[0].clone()
            let p2 = activeList[2].clone()
            p1.add(activeList[3])
            p2.add(activeList[3])
            fromRadialSelection(createVoxel,p1,p2)
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    selectSphere.position.z = 1000
    selectCubeRenderer.render(selectCubeScene, camera)
}

function eraseRadialSelectionOnEnd(){
    if(activeList.length == 4){
        if(myObject.mode == "Erase Radial Selection"){//later it should be "Select->Create" mode
            let p1 = activeList[0].clone()
            let p2 = activeList[2].clone()
            p1.add(activeList[3])
            p2.add(activeList[3])
            p1 = p1.sub(activeList[1])
            p2 = p2.sub(activeList[1])
            fromRadialSelection(deleteInstanceAtPosition,p1,p2)
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    selectSphere.position.z = 1000
    selectCubeRenderer.render(selectCubeScene, camera)
}

function cylinderSelectOnEnd(){
    if(activeList.length == 4){
        if(myObject.mode == "Cylinder Select"){//later it should be "Select->Create" mode
            fromCylinderSelection(createVoxel,activeList[0],activeList[2])
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    selectCylinder.position.z = 1000
    selectCylinder.scale.set(1,0,1)
    selectCubeRenderer.render(selectCubeScene, camera)
}

function eraseCylinderSelectOnEnd(){
    if(activeList.length == 4){
        if(myObject.mode == "Erase Cylinder Selection"){//later it should be "Select->Create" mode
            let p1 = activeList[0].sub(activeList[1])
            let p2 = activeList[2].sub(activeList[1])
            fromCylinderSelection(deleteInstanceAtPosition,p1,p2)
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
    selectCylinder.position.z = 1000
    selectCylinder.scale.set(1,0,1)
    selectCubeRenderer.render(selectCubeScene, camera)
}

//HIGHER ORDER MODE FUNCTIONS
function fromSelection(callback, p1, p2){
    let [x1,x2] = sortPairAscending(p1.x,p2.x)
    let [y1,y2] = sortPairAscending(p1.y,p2.y)
    let [z1,z2] = sortPairAscending(p1.z,p2.z)

    for(let i = x1; i <= x2; i++){
        for(let j = y1; j <= y2; j++){
            for(let k = z1; k <= z2; k++){
                callback(new THREE.Vector3(i,j,k))
            }
        }
    }
}

//HIGHER ORDER MODE FUNCTIONS
function fromRadialSelection(callback, p1, p2){

    let [x1,x2] = sortPairAscending(p1.x, p2.x)
    let [y1,y2] = sortPairAscending(p1.y, p2.y)
    let [z1,z2] = sortPairAscending(p1.z, p2.z)
    let r = Math.floor(p1.distanceTo(p2))

    x1 = p1.x - r; x2 = p1.x + r
    y1 = p1.y - r; y2 = p1.y + r
    z1 = p1.z - r; z2 = p1.z + r

    for(let i = x1; i <= x2; i++){
        for(let j = y1; j <= y2; j++){
            for(let k = z1; k <= z2; k++){
                let p = new THREE.Vector3(i,j,k)
                let d = p1.distanceTo(p)

                if(d <= r){
                    callback(p)
                }
            }
        }
    }
}

//HIGHER ORDER MODE FUNCTIONS
function fromCylinderSelection(callback, p1, p2){

    let n = activeList[1]
    let n2 = activeList[3]
    let n2Sum = n2.x+n2.y+n2.z
    n2Sum = Math.abs(n2Sum) > 1 ? n2Sum : 0
    n2Sum = n.y == 0 ? -n2Sum : n2Sum

    let I = new THREE.Vector3(1,1,1)
    let absN = new THREE.Vector3(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z))
    let notN = I.sub(absN)
    
    let start = p1.clone()
    let end = p1.clone()
    let r = Math.floor(p1.distanceTo(p2))

    start.add(notN.clone().multiplyScalar(-r));//addToBByNotNormal(n,p1.clone(), -r)
    end.add(notN.clone().multiplyScalar(r));
    end.add(absN.clone().multiplyScalar(n2Sum))

    //We can't just sort both or all start/end elements because it will mess up
    //the result. I think the order of the other two elements is nessesary for
    //when we create and use it to get pv2 etc but I'm not sure how, didn't sleep well
    //last night

    if(n.z != 0){
        [start.z, end.z] = sortPairAscending(start.z, end.z)
    }
    else if(n.x != 0){
        [start.x, end.x] = sortPairAscending(start.x, end.x)
    }
    //and the cylinder is always rotated so it extrudes on it's y axis so we only need to 
    //sort x and z?

    for(let i = start.x; i <= end.x; i++){
        for(let j = start.y; j <= end.y; j++){
            for(let k = start.z; k <= end.z; k++){
                let p = new THREE.Vector3(i,j,k)
                let pv2 = getPlaneFromNormal(n,p)
                let p1v2 = getPlaneFromNormal(n,p1)
                let d = p1v2.distanceTo(pv2)

                if(d <= r){
                    callback(p)
                }
            }
        }
    }
}

//DRAW MODE
function drawVoxels(){

    if (!wait) {
        wait = true;

    if(currentMode == "Draw"){
        let hit = getAnyHit()
        let p = getAnyHitPosition(hit)
        if(p){
            createVoxel(p)
            //loadObjectVoxel(objectName, p, color)
            activeList.push(p)
        }
    }
    
    setTimeout(function() {
        wait = false
      }, 25)
    }
}

//ERASE MODE
function erase(){
    if(currentMode == "Erase"){
        //this also pushes to the active list
        //that's confusing!!
        let p = getNotActiveVoxelPosition()
        if(p){
            deleteInstanceAtPosition(p)
            /*let object = getFirstObjectVoxelKey(p)
            let name = object ? object["name"] : null
            console.log(name);
            deleteObjectVoxel(p, name)
            if(object){
                delete object["positions"][getKey(p)]
                objectDictionary[object["name"]] = object
            }*/
            activeList.push(p)//push current p as well
            mesh.instanceMatrix.needsUpdate = true
            renderer.shadowMap.needsUpdate = true
        }
    }
}

//PAINT MODE
function paint(){
    if(currentMode == "Paint"){
        let vox = getHitVoxel();
        if(vox){
            setInstanceColor(vox.instanceId, myObject.paintColor)
            setObjectColor(vox.instanceId, myObject.paintColor)
            //should set worldVox["color"] which it does
            //but also set the color of the first object in line
        }
    }
}


function translateObject(translation){

    let objectName = objectBase["name"]
    //Without clone, ref is still tied to positions but to be safe
    let positions = cloneDictionary(objectBase["positions"])
    objectBase["positions"] = {}

    //delete the old voxels
    for(let key in positions){
        let p = stringToVector3(key)
        deleteObjectVoxel(p, objectName)
    }

    //add translated position key -> color to new object
    for(let key in positions){
        let p = stringToVector3(key)
        p.add(translation) 
        let color = positions[key]
        loadObjectVoxel(p, objectName, color)
        objectBase["positions"][getKey(p)] = color
    }

    //incase box is deselected, store it's last translation
    //for when it's selected again
    console.log(objectBase["currentPosition"]);
    objectBase["currentPosition"].add(translation)
    objectDictionary[objectName] = objectBase// = newObject
    //console.log(cloneObject(objectBase));
    //update mesh and renderer
    mesh.instanceMatrix.needsUpdate = true
    renderer.shadowMap.needsUpdate = true
}

//MOVE MODE
let objectBoxPStart = null
let objectBoxPReference = null
let objectBoxNormal = null
let mouseAtObjectBox = null

function resetObjectBox(){
    objectBoxPStart = null
    objectBoxNormal = null
    mouseAtObjectBox = null
    objectBoxPReference = null
    //objectBase = null
}

function setObjectBox(){
    let hit = raycaster.intersectObject(objectBox)
    if(hit.length){
        objectBoxNormal = hit[0].face.normal.clone()
        mouseAtObjectBox = mouse.clone()
        objectBoxPReference = hit[0].object.position
        objectBoxPStart = objectBoxPReference.clone()
    }
    else{
        //objectBox.position.z = 1000
        objectBox.material.visible = false
        resetObjectBox()
        objectBase = null
    }
}

function MoveOnEnd(){    
    if(objectBoxPReference){
        let translation = objectBoxPReference.clone()
        translation.sub(objectBoxPStart)
        translateObject(translation)
    }
    resetObjectBox()
}

function selectObjectByVoxel(){
    let hit = getHitVoxel()
    if(hit){
        let id = hit.instanceId
        let p = getInstancePositionByID(id)
        let worldVox = worldDictionary[getKey(p)]
        //let objectList = worldVox["objectColors"]
        let objectsHere = Object.keys(worldVox["objectsHere"])
        //let key = getNextKey(objectList)
        let key = objectsHere.length > 0 ? 
                  objectsHere[objectsHere.length-1] : 
                  null
        if(key){
            let newObject = objectDictionary[key]
            objectBase = newObject
            //objectBox.position.z -= 1000
           
            createObjectBox(objectBase["dimentions"], 
                            objectBase["currentPosition"])
        }
    }
}

function moveSelectionBox(m){
    let [x,y] = getMouseDelta(mouseAtObjectBox.x, mouseAtObjectBox.y)
    let n = objectBoxNormal.clone()
    let p = objectBoxPStart.clone()
    if(Math.abs(n.y) < 0.5){y = -y}
    n.multiplyScalar(y)
    p.add(n)
    objectBox.position.set(p.x,p.y,p.z)
}

function move(){
    if(currentMode == "Move"){
        //no mouse + object, get box ready for movement
        if(!mouseAtObjectBox && objectBase){
            setObjectBox()
        }
        // mouse + object selected ,update box position
        else if(mouseAtObjectBox && objectBase){
            moveSelectionBox()
        }
        //no mouse no object, try to select object + create box
        else if(!mouseAtObjectBox && !objectBase){
            selectObjectByVoxel()
        }
    }
}

let isKeyPressed = false;

window.addEventListener('keyup', function(event) {
  isKeyPressed = false;
});

window.addEventListener('keydown', function(event) {
  if (!isKeyPressed) {
    isKeyPressed = true;
    console.log("Key pressed:", event.key);
    switch (event.key) {
        case "d":
            duplicateObject()
            break;
        case "o":
            selectionToObject()
            break;
        case "x":
            rotate(event.key)
            break;  
        case "y":
            rotate(event.key)
            break;
        case "z":
            rotate(event.key)
            break;
        default:
            break;
    }
  }
});

function duplicateObject() {
    if(objectBase){
        let duplicate = cloneObject(objectBase)
        loadObject(duplicate) 
        console.log(objectDictionary);
    }
}

function rotateByAxis(axis, p, newP){
    switch (axis) {
        case "x":
            newP.z = p.y, newP.y = -p.z
            break;
        case "y":
            newP.z = p.x, newP.x = -p.z
            break;
        case "z":
            newP.x = p.y, newP.y = -p.x
            break;
    }
    return newP
}

function rotate(axis){
    if(objectBase){
        console.log(axis);
        let objectName = objectBase["name"]
        //Without clone, ref is still tied to positions but to be safe
        let positions = cloneDictionary(objectBase["positions"])
        objectBase["positions"] = {}
        
        //delete the old voxels
        for(let key in positions){
            let p = stringToVector3(key)
            deleteObjectVoxel(p, objectName)
        }

        //add translated position key -> color to new object
        for(let key in positions){
            let p = stringToVector3(key)
            p.sub(objectBase["currentPosition"])
            let newP = p.clone()
            newP = rotateByAxis(axis, p, newP)
            newP.add(objectBase["currentPosition"])
            let color = positions[key]
            loadObjectVoxel(newP, objectName, color)
            objectBase["positions"][getKey(newP)] = color
        }

        objectDictionary[objectName] = objectBase// = newObject
        mesh.instanceMatrix.needsUpdate = true
        renderer.shadowMap.needsUpdate = true
        renderer.render(scene, camera)
    }
}

//CREATE BOX FROM SELECTION

const selectCubeGeo = new THREE.BoxGeometry(1,1,1);
const selectCubeMat = new THREE.MeshStandardMaterial(    
    {color:"0xffffff", 
    transparent: true, 
    opacity: 0.5, 
    depthTest: true})
//new THREE.MeshBasicMaterial({color:"0xffdddd", wireframe: true})
const selectCube = new THREE.Mesh(selectCubeGeo,selectCubeMat)
selectCube.position.z = 1000
selectCubeScene.add(selectCube) 

function createSelectCube(p1,p2){

    let n = activeList[1].clone()
    let absN = new THREE.Vector3(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z))
    let I = new THREE.Vector3(1,1,1)
    
    let notN = I.sub(absN);
    
    let w = Math.max(0,Math.abs(p1.x-p2.x)) + notN.x +0.001//expanding selection cube to edges 
    let h = Math.max(0,Math.abs(p1.y-p2.y)) + notN.y +0.001
    let d = Math.max(0,Math.abs(p1.z-p2.z)) + notN.z +0.001
    selectCube.scale.set(w,h,d)

    
    n.multiplyScalar(0.5)  
    let xMid = midPoint(p1.x,p2.x) - n.x//setting selection cube on the surface
    let yMid = midPoint(p1.y,p2.y) - n.y
    let zMid = midPoint(p1.z,p2.z) - n.z

    selectCube.position.x = xMid;//xPair[0]w/2 +0.5 //xPair[0] - w/2 +0.5
    selectCube.position.y = yMid;//h/2 +0.5 //yPair[0] - h/2 +0.5
    selectCube.position.z = zMid;//d/2 +0.5 //zPair[0] - d/2 +0.5
}



let mouseStart = null
let wait = false
function boxSelect(){    

    if (!wait) {
        wait = true;

    if(activeList.length == 0){ //no list, get first point
        getSelectionHitA()    
    }
    else if(activeList.length == 2){ //list with p and n, get second point
        getSelectionHitB2()  
    }
    else if(activeList.length == 4 && (currentMode == "Select" || currentMode == "Erase Selection"
                                    || currentMode == "Paint Selection"  )){
        getSelectionHitB2() 
        createSelectCube(activeList[0],activeList[2]) //full list (p,n,p,n) create cube
    }
    else if(activeList.length == 4 && 
            (currentMode == "Select_B" || currentMode == "Erase Selection_B") ){
        getSelectionHitC()
        createSelectCube(activeList[0],activeList[2]) //full list (p,n,p,n) create cube
    }

    setTimeout(function() {
        wait = false;
      }, 50);
    }
}

let toObjectStart = null
let toObjectEnd = null
let toObjectNormal = null
function addToNewObject(p,newObject){
    
    let worldVox = worldDictionary[getKey(p)]
    //console.log(p);
    if(worldVox && worldVox["count"] > 0){
        //console.log(p);
        let color = worldVox["color"]
        worldVox["objectsHere"][newObject["name"]] = null
        newObject["positions"][getKey(p)] = color
    }
}

function selectionToObject(){
    console.log("selection to object");
    if(toObjectStart){
        let name = (prompt('Enter an object name', 'newObject'))
        name = generateObjectName(name)
        console.log("makeing new object named: " + name + "");
        let newObject = createNewObject()
        newObject["name"] = name
        //subtract the normal from end position to correct for the extruded
        //side always having a dimntion of atleast 1 hile the others will be min 0 
        let [x1,x2] = sortPairAscending(toObjectStart.x,toObjectEnd.x);//+toObjectNormal.x)
        let [y1,y2] = sortPairAscending(toObjectStart.y,toObjectEnd.y);//+toObjectNormal.y)
        let [z1,z2] = sortPairAscending(toObjectStart.z,toObjectEnd.z);//+toObjectNormal.z)
        let width = x2-x1, height = y2-y1, depth = z2-z1
        let origin = new THREE.Vector3(
            x1 + width/2-toObjectNormal.x*0.5, 
            y1 + height/2-toObjectNormal.y*0.5, 
            z1 + depth/2-toObjectNormal.z*0.5 
            )

        let antiNormal = getAntiNormal(toObjectNormal)
        //add one to all dimentions afer
        newObject["dimentions"]["width"] = width+antiNormal.x
        newObject["dimentions"]["height"] = height+antiNormal.y
        newObject["dimentions"]["depth"] = depth+antiNormal.z
        newObject["currentPosition"] = origin
        console.log(newObject["dimentions"]);
        for(let i = x1; i <= x2; i++){
            for(let j = y1; j <= y2; j++){
                for(let k = z1; k <= z2; k++){
                    let p = new THREE.Vector3(i,j,k)
                    addToNewObject(p, newObject)
                }
            }
        }

        console.log(newObject);
        objectDictionary[name] = newObject
        toObjectStart = toObjectEnd = toObjectNormal = null
        selectCube.position.z = 1000
        selectCubeRenderer.render(selectCubeScene, camera)
    }
}

function boxSelectAsObjectOnEnd(){
    if(activeList.length > 3){
        toObjectStart = activeList[0]
        toObjectNormal = activeList[1]
        toObjectEnd = activeList[2]
        
        console.log(toObjectStart);
        console.log(toObjectEnd);
    }
}

window.addEventListener("mousedown", function(event){
    if (myObject.mode == "To Object" && event.buttons == 1) {
        let hit = getAnyHit()
        if(!hit){
            selectCube.position.z = 1000
            selectCubeRenderer.render(selectCubeScene, camera)
        }
    }
})
function boxSelectAsObject(){    

    if (!wait) {
        wait = true;

    if(activeList.length == 0){ //no list, get first point
        getSelectionHitA()    
    }
    else if(activeList.length == 2){ //list with p and n, get second point
        getSelectionHitB2()  
    }
    else if(activeList.length == 4 && (currentMode == "To Object")){
        getSelectionHitB2() 
        createSelectCube(activeList[0],activeList[2]) //full list (p,n,p,n) create cube
    }
    else if(activeList.length == 4 && (currentMode == "To Object_B")){
        getSelectionHitC()
        createSelectCube(activeList[0],activeList[2]) //full list (p,n,p,n) create cube
    }

    setTimeout(function() {
        wait = false;
      }, 50);
    }
}



//CREATE SPHERE
const selectSphereGeo = new THREE.SphereGeometry(1,30,30);
const selectSphereMat = new THREE.MeshBasicMaterial({color:"0xff0000", wireframe: true})
const selectSphere = new THREE.Mesh(selectSphereGeo,selectSphereMat)
selectSphere.position.z = 1000
let sphereRadius = 0
selectCubeScene.add(selectSphere)

function createSelectSphere(p1,p2){
    let d = p1.distanceTo(p2)
    selectSphere.scale.set(d,d,d)
    let heightByNormal = activeList[3]
    let pt = p1.clone()
    pt.add(heightByNormal)
    selectSphere.position.set(pt.x,pt.y,pt.z)
}

function radialSelect(){    
    if(activeList.length == 0){ //no list, get first point
        getSelectionHitA()    
    }
    else if(activeList.length == 2){ //list with p and n, get second point
        getSelectionHitB2()  
    }
    else if(activeList.length == 4 && (currentMode == "Radial Select" || currentMode == "Erase Radial Selection")){
        getSelectionHitB2() 
        createSelectSphere(activeList[0],activeList[2]) //full list (p,n,p,n) create cube
    }
    else if(activeList.length == 4 && 
            (currentMode == "Radial Select_B" || currentMode == "Erase Radial Selection_B") ){
        getSphereSelectionHitC() //getSelectionHitC()
        createSelectSphere(activeList[0],activeList[2]) //full list (p,n,p,n) create cube
    }
}

//CREATE CYLINDER
const selectCylinderGeo = new THREE.CylinderGeometry(1,1,1,30,3);
const selectCylinderMat = new THREE.MeshBasicMaterial({color:"0xff0000", wireframe: true})
const selectCylinder = new THREE.Mesh(selectCylinderGeo, selectCylinderMat)
selectCylinder.position.z = 1000
let cylinderRadius = 0
selectCubeScene.add(selectCylinder) 

function createSelectCylinder(p1, p2){
    let n = activeList[1].clone()
    let n2 = activeList[3].clone()
    let d = p1.distanceTo(p2)

    let rot = n.clone().multiplyScalar(Math.PI*0.5)
    selectCylinder.rotation.set(rot.z,0,rot.x)

    let n2Sum = n2.x+n2.y+n2.z
    n2Sum = Math.abs(n2Sum) > 1 ? n2Sum : 0 //takes care of if we are extruding or not yet
    n2Sum = n.y == 0 ? -n2Sum : n2Sum //fix for if we aren't moving on y
    n2Sum = n.y < 0. || n.x < 0 || n.z < 0 ? -n2Sum : n2Sum //fix for other sides

    selectCylinder.scale.set(d,n2Sum,d)//for this
    let off = n.multiplyScalar(n2Sum/2) //and for this which will be 0 before extrude

    selectCylinder.position.set(p1.x+off.x,p1.y+off.y,p1.z+off.z)
}

function cylinderSelect(){    
    if(activeList.length == 0){ //no list, get first point
        getSelectionHitA()    
    }
    else if(activeList.length == 2){ //list with p and n, get second point
        getSelectionHitB2()  
    }
    else if(activeList.length == 4 && (currentMode == "Cylinder Select" || currentMode == "Erase Cylinder Selection")){
        getSelectionHitB2() 
        createSelectCylinder(activeList[0], activeList[2]) //full list (p,n,p,n) create cube
    }
    else if(activeList.length == 4 && 
            (currentMode == "Cylinder Select_B" || currentMode == "Erase Cylinder Selection_B") ){
        getCylinderSelectionHitC()
        createSelectCylinder(activeList[0], activeList[2]) //full list (p,n,p,n) create cube
    }
}


//COLOR SELECTION BY COLOR
let referenceOfSelectColor = gui.addColor(myObject, 'selectColor').onChange(value =>{setAllToColor(value)});
let colorList = [] //activeList is [] on mouse up so we use colorList
window.addEventListener('click', function(){if(myObject.mode == "All Of Color"){selectByColor()}});

function selectByColor(){
    if(myObject.mode == "All Of Color"){
        let vox = getHitVoxel()
        if(vox){
            colorList = []
            let p = getInstancePositionByVoxel(vox)
            let color = getColorAtPostion(p) // if you just hit a new voxel update prevColor to this
            referenceOfSelectColor.setValue(color) // triggers our onchange function
                                                   // moving this to below the for loop doens't work?
            for(let id = 0; id < Math.pow(rowNum, 3); id++){
                let currPos = getInstancePositionByID(id)
                if(currPos.z < rowNum*2){              // if the pos z is clearly not farplane
                    let currCol = getColorAtPostion(currPos)
                    if(currCol == myObject.selectColor){
                        colorList.push(id)
                    }
                }
            }
        }
    }
}

var isDebouncing = false; // Variable to track debounce state
var debounceDelay = 100;  // Delay in milliseconds for debouncing
function setAllToColor(params) {
    if(!isDebouncing) {
        isDebouncing = true
        if(myObject.mode == "All Of Color" && colorList.length){
            for(let id of colorList){
                setInstanceColor(id, myObject.selectColor)
                setObjectColor(id, myObject.selectColor)
            }
            mesh.instanceMatrix.needsUpdate = true;
            renderer.render(scene, camera)
        }
        setTimeout(function() {
            isDebouncing = false
          }, debounceDelay)
    }
}


//POPULATE THE MESH WITH INSTANCES
fillWorld()
//loadObject(objectBase)
//deleteObjectVoxel(new THREE.Vector3(0.5,0.5,0.5))


/* INFO
*
*/


function vectorToLabeledString(v){
    return   "X: " + parseFloat(v.x).toFixed(0) + 
          " | Y: " + parseFloat(v.y).toFixed(0) + 
          " | Z: " + parseFloat(v.z).toFixed(0) 
}

vectorToLabeledString(new THREE.Vector3(1,2,3))
//window.addEventListener('mouseup', function(){currentMode = "Idle"; modeOnMouseUp(); activeList = []});
function showInfo(){
    let info = document.getElementById("info")
    info.innerHTML = "<p>The Info:</p>"
    info.innerHTML += "<p>Current Mode: "+currentMode+"</p>"
    info.innerHTML += "<p>Menu Mode: "+myObject.mode+"</p>"
    info.innerHTML += "<p>Voxel Count: "+ uiVoxelCount+"</p>"
    let hit = getHitPlane()
    let position = "<p>No Hit</p>"
    if(hit){position = "<p>On Axis: " + vectorToLabeledString(hit.point) +"</p>"
    }
    info.innerHTML += position
    info.innerHTML += "<p>Mouse: X: "+parseFloat(mouse.x*rowNum).toFixed(0)+" | Y: "+parseFloat(mouse.y*rowNum).toFixed(0)+"</p>"
    
    if(activeList.length)
    info.innerHTML += "<p> X: "+activeList[0].x+"</p>"
    if(objectBase)
    info.innerHTML += "<p> Selected Object: "+objectBase["name"]+"</p>"
}

function clearInfo(){
    let info = document.getElementById("info")
    info.innerHTML = ""
}

showInfo()

/*
*
* ANIMATION LOOP
*
*/

let cp = camera.position.clone()
let czoom = camera.zoom
renderer.render(scene, camera)
const tick = () =>
{
    stats.begin()


    raycaster.setFromCamera(mouse, camera)
    controls.update()
    //MODE FUNCTION CALLS
    switch (currentMode) {
        case "Draw":
            drawVoxels()
            break;
        case "Erase":
            erase()
            break;
        case "Paint":
            paint()
            break;
        case "Select":
            boxSelect()//select()
            break;
        case "Select_B":
            boxSelect()//select()
            break;
        case "Erase Selection":
            boxSelect()
            break;
        case "Erase Selection_B":
            boxSelect()
            break;
        case "Radial Select":
            radialSelect()//select()
            break;
        case "Radial Select_B":
            radialSelect()
            break;
        case "Erase Radial Selection":
            radialSelect()
            break;
        case "Erase Radial Selection_B":
            radialSelect()
            break;
        case "Paint Selection":
            boxSelect()
            break;
        case "Cylinder Select":
            cylinderSelect()//select()
            break;
        case "Cylinder Select_B":
            cylinderSelect()//select()
            break;
        case "Erase Cylinder Selection":
            cylinderSelect()
            break;
        case "Erase Cylinder Selection_B":
            cylinderSelect()
            break;
        case "All Of Color":
         //   selectByColor()
            break;
        case "Move":
            move()
            break;
        case "To Object":
            boxSelectAsObject()
            break;
        case "To Object_B":
            boxSelectAsObject()
            break;
        default:
            break;
    }
    
        window.requestAnimationFrame(tick)

        if(!checkMatchingVector3(camera.position,cp) || camera.zoom != czoom || currentMode != "Idle"){
            /*if(currentMode == "Select" || currentMode == "Erase Selection" || currentMode == "Paint Selection" 
            || currentMode == "Select_B" || currentMode == "Erase Selection_B" || 
                currentMode == "Radial Select" || currentMode == "Erase Radial Selection" ||
                currentMode == "Cylinder Select" || currentMode == "Erase Cylinder Selection" ){
                selectCubeRenderer.render(selectCubeScene, camera)
            }*/
            if((currentMode.toLowerCase()).includes("select") || 
               (currentMode.toLowerCase()).includes("selection")) {
                selectCubeRenderer.render(selectCubeScene, camera)
            }
            else if(currentMode == "Move"){
                selectCubeRenderer.render(selectCubeScene, camera)
            }
            else if(currentMode == "To Object"){
                selectCubeRenderer.render(selectCubeScene, camera)
            }
            else{
                if (!isDebouncing) {
                    isDebouncing = true;

                    renderer.render(scene, camera)
                    if(myObject.mode == "Move"){
                        selectCubeRenderer.render(selectCubeScene, camera)
                    }
                    else if(myObject.mode == "To Object"){
                        selectCubeRenderer.render(selectCubeScene, camera)
                    }

                setTimeout(function() {
                    isDebouncing = false;
                  }, debounceDelay);
                }
            }
        }
        cp = camera.position.clone()
        czoom = camera.zoom
        showInfo()
    
    stats.end() 
}
tick()