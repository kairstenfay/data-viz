let renderer, scene, camera;

const WIDTH = 500;
const HEIGHT = 200;
const ASPECT = WIDTH / HEIGHT;

const init = () => {
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setClearColor(new THREE.Color('white'), 1)
	renderer.setSize( WIDTH, HEIGHT );
	const container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	// init scene and camera
	scene = new THREE.Scene();
	// fov, aspect, near, far
	camera = new THREE.PerspectiveCamera(45, ASPECT, 0.01, 1000);
	camera.position.y = 1;
	camera.position.z = 2;
	const controls = new THREE.OrbitControls(camera, renderer.domElement)

	// White directional light at half intensity shining from the top.
	const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	scene.add( directionalLight );

	// add sphere
	const geometry = new THREE.SphereGeometry(0.5, 32, 32);
	const material = new THREE.MeshStandardMaterial( {
		color: "green",
		metalness: 0,
		roughness: 1,
	} );
	const mesh= new THREE.Mesh( geometry, material );
	scene.add( mesh );

	// handle window resize
	window.addEventListener('resize', onWindowResize, false);

	animate();
}

const onWindowResize = () => {
	camera.aspect = ASPECT
	camera.updateProjectionMatrix()

	renderer.setSize( WIDTH, HEIGHT )
}

const animate = () => {
	requestAnimationFrame(animate);
	render();
}

const render = () => {
	renderer.render(scene, camera);
}

init();
