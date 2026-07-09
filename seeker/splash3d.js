/**
 * 틈타 (Teumta) - 3D splash screen (first-launch only)
 * Renders the brand .glb model spinning on a <canvas> via three.js, then hands
 * off to the intro-card onboarding step. ES module — loaded with type="module",
 * completely independent of the classic-script app.js.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const splash = document.getElementById('splash-screen');

// Onboarding already completed (or this element was never rendered) -> nothing to do.
if (splash) {
    const canvas = document.getElementById('splash-3d-canvas');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function resize() {
        const size = Math.max(Math.min(splash.clientWidth, splash.clientHeight) * 0.6, 220);
        renderer.setSize(size, size);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-3, -2, -4);
    scene.add(fillLight);

    let model = null;
    let mixer = null;

    new GLTFLoader().load(
        'assets/models/splash-model.glb',
        (gltf) => {
            model = gltf.scene;
            model.updateMatrixWorld(true);

            // Center the model and scale it to a consistent on-screen size regardless
            // of whatever units/scale it was exported with. Box3.setFromObject() alone
            // reports wildly inflated bounds for rigged/skinned meshes (it doesn't
            // account for skinning correctly), so the box is built by hand from each
            // mesh's own geometry bounds transformed into world space instead.
            const box = new THREE.Box3();
            model.traverse((obj) => {
                if (!obj.isMesh) return;
                obj.geometry.computeBoundingBox();
                const meshBox = obj.geometry.boundingBox.clone().applyMatrix4(obj.matrixWorld);
                box.union(meshBox);
            });
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 1.6 / maxDim;

            model.scale.setScalar(scale);
            model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

            scene.add(model);

            // Play back the model's own embedded animation (e.g. the punch clip)
            // instead of just spinning it in place.
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
            }
        },
        undefined,
        (err) => {
            console.error('Failed to load splash 3D model', err);
            advance();
        }
    );

    let advanced = false;
    function advance() {
        if (advanced) return;
        advanced = true;
        splash.classList.remove('active');
        document.getElementById('onboarding-cards').classList.add('active');
    }

    const clock = new THREE.Clock();
    function tick() {
        if (advanced) return;
        requestAnimationFrame(tick);
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
    }
    tick();

    setTimeout(advance, 4500);
}
