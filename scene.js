import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import { OBJLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/OBJLoader.js';


// Object manipulation global variables
let targetPosition = new THREE.Vector3(); 
let isMoving = false;
let selectedObject = null;
let isDragging = false;

// Camera global variables 
let isTopView = false;   
let originalCameraPosition = new THREE.Vector3();
let originalCameraQuaternion = new THREE.Quaternion();

// Scene setup, rendering, camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xabcdef);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

renderer.domElement.addEventListener('mousemove', OnDocumentMouseMove, false);
renderer.domElement.addEventListener('click', OnScreenClick, false);

//const geometry = new THREE.BoxGeometry();
//const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//const cube = new THREE.Mesh(geometry, material);
//scene.add(cube);

let interactableObjects = [];
camera.position.z = 10;

originalCameraPosition.copy(camera.position);
originalCameraQuaternion.copy(camera.quaternion);

//Predefined models
const models = {
    car: null,
    obstacle: null,
    environment: null
};

function OnScreenClick(event) 
{
    event.preventDefault();
    if (isDragging) 
    {
        isDragging = false;
        if (selectedObject) 
        {
            RemoveAxisLines(selectedObject); 
        }
        selectedObject = null;
        return;
    }

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactableObjects, true);

    if (intersects.length > 0)
    {
        let intersectedObject = intersects[0].object;
        selectedObject = intersectedObject;
        isDragging = true;
        console.log("Object clicked, adding axis lines");
        DrawAxisLines(selectedObject); 
    }
}

function DrawAxisLines(object) 
{
    const axisLength = 10;
    const lineColor = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
    lineColor.depthTest = false;
    lineColor.depthWrite = false;

    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(axisLength, 0, 0)]);
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, axisLength, 0)]);
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, axisLength)]);

    const xAxisLine = new THREE.Line(xAxisGeometry, lineColor);
    const yAxisLine = new THREE.Line(yAxisGeometry, lineColor);
    const zAxisLine = new THREE.Line(zAxisGeometry, lineColor);

    const axisGroup = new THREE.Group();
    axisGroup.add(xAxisLine, yAxisLine, zAxisLine);

    object.add(axisGroup);
    console.log("axis lines added to object", axisGroup);
}

function RemoveAxisLines(object) 
{
    const axisGroup = object.children[object.children.length - 1];
    object.remove(axisGroup);
}

function OnDocumentMouseMove(event)
{
    if (isDragging && selectedObject) 
    {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const planeNormal = (isTopView) ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
        const plane = new THREE.Plane(planeNormal, 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);

        selectedObject.position.copy(intersection);
    }
}

document.addEventListener('keypress', (e) => {
    if (e.key === 'N' || e.key === 'n') 
    {
        const inspector = document.getElementById('inspector');
        inspector.classList.toggle('visible');
    }
    if (e.key === '0') 
    {
        isTopView = !isTopView;  
        if (isTopView)
        {
            camera.position.set(0, 5, 0);
            camera.lookAt(scene.position);
            camera.up.set(0, 0, 1); 
        } else 
        {
            camera.position.copy(originalCameraPosition);
            camera.quaternion.copy(originalCameraQuaternion);
        }
    }
});


function LoadModel(fileInputId, modelType) 
{
    const fileInput = document.getElementById(fileInputId);
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file)
        {
            console.error("No file selected.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const contents = event.target.result;
            const objLoader = new OBJLoader();
            objLoader.load(contents, (object) => {
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh) 
                    {
                        child.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                        interactableObjects.push(child);
                    }
                });

                if (models[modelType])
                {
                    scene.remove(models[modelType]); 
                }
                models[modelType] = object; 
                scene.add(object);
                UpdateModelPosition(modelType); 
            });
        };
        reader.readAsDataURL(file); 
    });
}

function UpdateModelPosition(modelType) 
{
    const xInput = document.getElementById(modelType + '-x');
    const yInput = document.getElementById(modelType + '-y');
    const zInput = document.getElementById(modelType + '-z');

    if (models[modelType]) 
    {
        const x = parseFloat(xInput.value) || 0;
        const y = parseFloat(yInput.value) || 0;
        const z = parseFloat(zInput.value) || 0;
        models[modelType].position.set(x, y, z);
    }
}

function ApplyTexture(textureInputId, modelType) 
{
    const textureInput = document.getElementById(textureInputId);
    textureInput.addEventListener('change', (e) => {
        const textureFile = e.target.files[0];
        if (!textureFile) {
            console.error("No texture file selected.");
            return;
        }
        if (!models[modelType]) {
            alert("Please add a 3D model first.");
            return;
        }

        const textureReader = new FileReader();
        textureReader.onload = function(textureEvent) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(textureEvent.target.result, function (texture) {
                models[modelType].traverse((child) => {
                    if (child instanceof THREE.Mesh) 
                    {
                        child.material = new THREE.MeshBasicMaterial({ map: texture });
                    }
                });
                renderer.render(scene, camera); 
            });
        };
        textureReader.readAsDataURL(textureFile);
    });
}

function setupPositionInputListeners(modelType)
{
    const xInput = document.getElementById(modelType + '-x');
    const yInput = document.getElementById(modelType + '-y');
    const zInput = document.getElementById(modelType + '-z');

    xInput.addEventListener('input', () => UpdateModelPosition(modelType));
    yInput.addEventListener('input', () => UpdateModelPosition(modelType));
    zInput.addEventListener('input', () => UpdateModelPosition(modelType));
}

window.onload = function() 
{
    ['obstacle', 'car', 'environment'].forEach(type => {
        LoadModel(type + '-upload', type);
        ApplyTexture(type + '-texture-upload', type);
        setupPositionInputListeners(type);
    });

    document.getElementById('move-obstacle').addEventListener('click', () => {
        const targetX = parseFloat(document.getElementById('moveTo-x').value) || 0;
        targetPosition.set(targetX, 0, 0);
        isMoving = true;
    });
};


function Animate() 
{
    requestAnimationFrame(Animate);
    if (isDragging && selectedObject) 
    {
        const axisGroup = selectedObject.children[selectedObject.children.length - 1];
        if (axisGroup) 
        {
            console.log("animating selected object");
            axisGroup.position.copy(selectedObject.position); 
            console.log("axis position updated", axisGroup.position); 
        }
    }
    if (isMoving && models.obstacle) 
    {
        models.obstacle.position.lerp(targetPosition, 0.05);
        if (models.obstacle.position.distanceTo(targetPosition) == 0.0) 
        {
            isMoving = false;
        }
    }
    renderer.render(scene, camera);
}


Animate();



