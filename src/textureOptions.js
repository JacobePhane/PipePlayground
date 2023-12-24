//let matcapTexture = textureLoader.load('/textures/matcaps/2.png')
 //matcapTexture = textureLoader.load('/textures/matcaps/3.png')
 //matcapTexture = textureLoader.load('/textures/matcaps/4.png')
//matcapTexture = textureLoader.load('/textures/matcaps/5.png')
//matcapTexture = textureLoader.load('/textures/matcaps/6.png')
//matcapTexture = textureLoader.load('/textures/matcaps/7.png')
// matcapTexture = textureLoader.load('/textures/matcaps/8.png')

/*
const colorTexture = textureLoader.load('/textures/Concrete_Muddy_001_SD/Concrete_Muddy_001_BaseColor.jpg')
const heightTexture = textureLoader.load('/textures/Concrete_Muddy_001_SD/Concrete_Muddy_001_Height.jpg')
const normalTexture = textureLoader.load('/textures/Concrete_Muddy_001_SD/Concrete_Muddy_001_Normal.jpg')
const ambientOcclusionTexture = textureLoader.load('/textures/Concrete_Muddy_001_SD/Concrete_Muddy_001_AmbientOcclusion.jpg')
const roughnessTexture = textureLoader.load('/textures/Concrete_Muddy_001_SD/Concrete_Muddy_001_Roughness.jpg')
*/


/*
const colorTexture = textureLoader.load('/textures/Dirt_006_SD/Dirt_006_BaseColor.png')
const heightTexture = textureLoader.load('/textures/Dirt_006_SD/Dirt_006_Height.jpg')
const normalTexture = textureLoader.load('/textures/Dirt_006_SD/Dirt_006_Normal.jpg')
const ambientOcclusionTexture = textureLoader.load('/textures/Dirt_006_SD/Dirt_006_AmbientOcclusion.jpg')
const roughnessTexture = textureLoader.load('/textures/Dirt_006_SD/Dirt_006_Roughness.jpg')


*/


/*
const colorTexture = textureLoader.load('/textures/Concrete_019_SD/Concrete_019_BaseColor.jpg')
const heightTexture = textureLoader.load('/textures/Concrete_019_SD/Concrete_019_Height.jpg')
const normalTexture = textureLoader.load('/textures/Concrete_019_SD/Concrete_019_Normal.jpg')
const ambientOcclusionTexture = textureLoader.load('/textures/Concrete_019_SD/Concrete_019_AmbientOcclusion.jpg')
const roughnessTexture = textureLoader.load('/textures/Concrete_019_SD/Concrete_019_Roughness.jpg')
*/

/*
const colorTexture = textureLoader.load('/textures/Sci-fi_Wall_004_SD/Sci-fi_Wall_004_basecolor.jpg');
const heightTexture = textureLoader.load('/textures/Sci-fi_Wall_004_SD/Sci-fi_Wall_004_height.jpg');
const normalTexture = textureLoader.load('/textures/Sci-fi_Wall_004_SD/Sci-fi_Wall_004_normal.jpg');
const ambientOcclusionTexture = textureLoader.load('/textures/Sci-fi_Wall_004_SD/Sci-fi_Wall_004_ambientOcclusion.jpg');
const roughnessTexture = textureLoader.load('/textures/Sci-fi_Wall_004_SD/Sci-fi_Wall_004_roughness.jpg');

*/
/*
const colorTexture = textureLoader.load('/textures/Metal_Plate_Rusted_001_SD/Metal_Plate_Rusted_001_basecolor.jpg');
const heightTexture = textureLoader.load('/textures/Metal_Plate_Rusted_001_SD/Metal_Plate_Rusted_001_height.jpg');
const normalTexture = textureLoader.load('/textures/Metal_Plate_Rusted_001_SD/Metal_Plate_Rusted_001_normal.jpg');
const ambientOcclusionTexture = textureLoader.load('/textures/Metal_Plate_Rusted_001_SD/Metal_Plate_Rusted_001_ambientOcclusion.jpg');
const roughnessTexture = textureLoader.load('/textures/Metal_Plate_Rusted_001_SD/Metal_Plate_Rusted_001_roughness.jpg');
*/

//const colorTexture = textureLoader.load('/textures/uvchecker.png')

/*

normalTexture.repeat = colorTexture.repeat = heightTexture.repeat = normalTexture.repeat = ambientOcclusionTexture.repeat = textureScale



//let material = new THREE.MeshToonMaterial()
//material.gradientMap = gradientTexture

//material = new THREE.MeshMatcapMaterial({color: 0xffffff, matcap: matcapTexture, map:colorTexture})


//material.aoMap.uv2 = true;
//material.roughness = 1
/*
material = new THREE.MeshPhongMaterial()
material.shininess = 100
material.specular = new THREE.Color(0x1188ff)
material = new THREE.MeshToonMaterial()
//material.gradientMap = gradientTexture
material = new THREE.MeshStandardMaterial()

material.metalness = 0.7
material.roughness = 0.2*/


//material.transparent = true
//material.opacity = 0.5
//potential method for shadows for instances
/*const material = new THREE.MeshStandardMaterial({
    diffuse: 0x888800,
    lights: true
  });
  var instanceMaterial=new THREE.MeshLambertMaterial();
  instanceMaterial.onBeforeCompile= shader =>{
     shader.vertexShader =
      `
          attribute vec3 offset;
          attribute vec4 orientation;

          vec3 applyQuaternionToVector( vec4 q, vec3 v ){
             return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
          }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `                     
          vec3 vPosition = applyQuaternionToVector( orientation, transformed );
   
          vec4 mvPosition = modelViewMatrix * vec4( vPosition, 1.0 );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( offset + vPosition, 1.0 );
      `);     
    
  }
*/