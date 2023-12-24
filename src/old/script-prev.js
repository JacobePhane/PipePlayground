import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import * as dat from 'lil-gui'

import GUI from 'lil-gui'; 





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
                 "Camera View": "Default"};

gui.add( myObject, 'mode', ["Add", 
                            "Del", 
                            "Draw", 
                            "Erase", 
                            "Edit", 
                            "Color",
                            "Box Select",
                            "Square Select",
                            "Extrude One",
                            "Extrude Level" ] );

gui.add( myObject, 'Camera View', ["Default", "X","Y","Z"]).onChange(value =>{cameraChange(value)});

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

/**
 * Animate
 */

let hitObject = null
let litVox = null
let selectedObject = null
let hitFace = null

const phantomList = []
const hitFaceMat = new THREE.MeshStandardMaterial({color:'#00ff00'})



const boxMat = new THREE.MeshStandardMaterial({color:'#0000ff'})
const boxGeo = new THREE.BoxGeometry(1,1,1);

function deleteVox(){

}

function deleteGroup(){

}

function addVox(){

}

function addGroup(){

}

function highlightVox(){

}

function selectVox(){

}

let erasing = true;
function erase(){
    if(erasing && hitObject && myObject.mode == "Erase"){
        sceneList = sceneList.filter(obj => obj !== hitObject);
        scene.remove(hitObject)
        hitObject.material.dispose()
        hitObject = null
    }
}

window.addEventListener('mouseup', stopErasing);
window.addEventListener('mousedown', startErasing);

function startErasing(){
    console.log("erasing")
    erasing = true;
}

function stopErasing(){
    console.log("stoperasing")
    erasing = false;
}



let drawing = false;
function drawVoxels(){
    if(drawing && phantomList.length && myObject.mode == "Draw"){

        let wallObject = phantomList[0]
        wallObject.material = new THREE.MeshStandardMaterial({color:'#0000ff'})
        wallObject.userData.visited = false
        sceneList.push(wallObject)
        phantomList.pop()

    }
}

window.addEventListener('mousedown', startDrawing);
window.addEventListener('mouseup', stopDrawing);

function startDrawing(){drawing = true;}
function stopDrawing(){drawing = false;}

window.addEventListener('click', () =>
{
    if(myObject.mode == "Del"){
            if(hitObject && sceneList.length > 1){
            sceneList = sceneList.filter(obj => obj !== hitObject);
            scene.remove(hitObject)
            hitObject.material.dispose()
            hitObject = null
        }
    }
})


window.addEventListener('click', () =>
{
    if(myObject.mode == "Edit"){
            if(hitObject){
            bfs(hitObject)
        }
    }
})




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






window.addEventListener('click', () =>
{
    if(myObject.mode == "Add"){
        if(hitObject){

            const newVox = new THREE.Mesh(boxGeo, boxMat)
            newVox.position.add(hitNormal)
            newVox.position.add(hit.position)
            phantomList.push(hitFace)
            scene.add(hitFace)



            hitFace.userData.visited = false
            sceneList.push(hitFace)
            hitFace = null
            phantomList.pop()
            hitObject.material.color.set("blue")
            hitObject = null

        }
    }
})
window.addEventListener('click', () =>
{
    if(myObject.mode == "Add"){
        if(hitObject && (!selectedObject))
        {
            selectedObject = hitObject
            selectedObject.material.color.set("yellow")
        }
        else if(hitObject && selectedObject)
        {
            if(hitObject == selectedObject){
                selectedObject.material.color.set("blue")
                selectedObject = null
                hitObject = null
            }
            else{
                console.log("new object selected")
                selectedObject.material.color.set("blue")
                selectedObject = hitObject
                selectedObject.material.color.set("yellow")
            }
            
        }
        else if(!hitObject && selectedObject)
        {
            console.log('no case / selected')
        }
        else if(!hitObject && !selectedObject)
        {
            console.log('no case')
            
        }
    }
})

const dirs = [new THREE.Vector3(1.,0.,0.),
              new THREE.Vector3(-1.,0.,0.),
              new THREE.Vector3(0.,1.,0.),
              new THREE.Vector3(0.,-1.,0.),
              new THREE.Vector3(0.,0.,1.),
              new THREE.Vector3(0.,0.,-1.),
            ]


/* basic bfs is like the level order traversal for a binary tree
wurzel in queue pop queue(wurzel first round) add popped to ergebnis put children in queue */
function bfs(root){
    root.userData.visited = true 
    let q = [root], erg = []

    while(q.length){
        let akt = q.pop()
        erg.push(akt)
        let rayOrigin = akt.position
        
        for(let dir of dirs){ //for each cube direction
            //test if cube exists at testPos 
            raycaster.set(rayOrigin, dir, 0, 1)
            let hits = raycaster.intersectObjects(sceneList); //sometimes gives dups
            for ( let i = 0; i < hits.length; i ++ ) {
                
                if(hits[i].object != akt &&  //and isn't visited and isn't the akt node
                   hits[i].object.userData.visited == false &&
                   hits[i].distance < 0.75){

                    hits[i].object.material.color.set( 0xffff00 ); //change color
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


const tick = () =>
{
    
    
    
    raycaster.setFromCamera(mouse, camera)
    controls.update()

    const planeIntersects = raycaster.intersectObjects(planeList)
    
    if(planeIntersects.length){
        if(myObject.mode == "Draw"){
            let p = planeIntersects[0].point;
            let gx = Math.floor(p.x)+0.5 //set starting positions for each plane
            let gy = Math.floor(p.y)+0.5
            let gz = Math.floor(p.z)+0.5
            switch(planeIntersects[0].object.userData.name){
                case "X":gx = 4.5; break;//set that final value  that can't be set with floor
                case "Y":gy = -4.5;break;
                case "Z":gz = 4.5; break;
           }


            if(!phantomList.length){
                hitFace = new THREE.Mesh(boxGeo, hitFaceMat)
                hitFace.position.set(gx,gy,gz);
                phantomList.push(hitFace)
                scene.add(hitFace)
            }
            else{
                phantomList.pop()
                scene.remove(hitFace)
                hitFace = new THREE.Mesh(boxGeo, hitFaceMat)
                hitFace.position.set(gx,gy,gz);
                phantomList.push(hitFace)
                scene.add(hitFace)
            }
        }
    }

    const intersects = raycaster.intersectObjects(sceneList)

    if(intersects.length){


        litVox = intersects[0]
        const hit = intersects[0].object
        const hitNormal = intersects[0].face.normal
/*
        if(myObject.mode == "Add"){
            if(!phantomList.length){
                hitFace = new THREE.Mesh(boxGeo, hitFaceMat)
                hitFace.position.add(hitNormal)
                hitFace.position.add(hit.position)
                phantomList.push(hitFace)
                scene.add(hitFace)
            }
            else{
                phantomList.pop()
                scene.remove(hitFace)
                hitFace = new THREE.Mesh(boxGeo, hitFaceMat)
                hitFace.position.add(hitNormal)
                hitFace.position.add(hit.position)
                phantomList.push(hitFace)
                scene.add(hitFace)
            }
        }
*/
        if(!hitObject){
            hitObject = hit
            if(selectedObject != hitObject){
                hitObject.material.color.set('red')
            }

            

        }
        else{
            //hit same object, no change
            if(hitObject == hit){
                
            }
            //hit new object and have prev object
            else{
                hitObject.material.color.set('blue')
                hitObject = hit
                hitObject.material.color.set('red')
            }
        }

    //check normal of the highlighted face
    //compareNormalTo2D(hitNormal)
    erase()
    

    }
    else{
        drawVoxels()
        //didn't hit anything and have prev object
        if(hitObject){
            //and prev object not selected
            if(!selectedObject){
                hitObject.material.color.set('blue')
                hitObject = null
            }
            else{
                //if selected, say nohit object but dont'change color
                hitObject = null
            }

            if(phantomList){
                phantomList.pop()
                scene.remove(hitFace)
            }
        }
        
        
    }

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)

    
}

tick()

/*
const angle = Math.PI / 4; // 45 degrees
const x = Math.cos(angle);
const y = Math.sin(angle);
// Create a Vector3 object and normalize it
const vector = new THREE.Vector3(x, y, 0);
vector.normalize();
const obv = new THREE.Vector3(0, -1, 0);
const axis = new THREE.Vector3();
axis.crossVectors(obv,vector)
axis.normalize();

const d = vector.dot(obv)
// Set the rotation of the object using setRotationFromAxisAngle
//obv.setRotationFromAxisAngle(axis, Math.acos(d));
// Set the rotation of the quaternion using setFromAxisAngle
const quaternion = new THREE.Quaternion();
quaternion.setFromAxisAngle(axis, Math.acos(d)); // y-axis rotation of 45 degrees
// Apply the rotation to the vector
obv.applyQuaternion(quaternion);

//Mouse Basis
const mouseBasis= {
    x : new THREE.Vector3(0.,1.,0.),
    y : new THREE.Vector3(1.,0.,0.)
}

function compareNormalTo2D(n){
    if(Math.abs(n.y) < 0.5){
        console.log("x moves the faces out.")
    }else{
        console.log("y moves the faces out.");
    }
}

else{
            //no object hit, nothing saved
            document.getElementById("data").innerHTML = "Data: "
        }
*/
