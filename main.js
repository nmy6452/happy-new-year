import * as THREE from 'three';
import { GLTFLoader } from "GLTFLoader";
import { OrbitControls } from 'OrbitControls';

    // 1. 전역 변수 선언
    let scene, camera, renderer, loader, mixer;
    const controls = {
        isDragging: false,
        previousMousePosition: { x: 0, y: 0 },
        rotationSpeed: 0.005,
    };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const modal = document.getElementById('myModal'); // HTML 모달

    // 2. 씬 초기화
    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color("skyblue");
    }

    // 3. 카메라 초기화
    function initCamera() {
        camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(-1, 3, 3);
    }

    // 4. 렌더러 초기화
    function initRenderer() {
        renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector("#canvas"),
            antialias: true,
        });
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // 5. 조명 설정
    function initLights() {
        const pointLight = new THREE.PointLight(0xffffff, 1);
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        pointLight.position.set(50, 50, 50);
        scene.add(pointLight, ambientLight);
    }

    // 6. 우체통 모델 로드 및 최초 렌더링
    function loadPostBoxModel() {
        loader = new GLTFLoader();
        loader.load("postbox/scene.gltf", (gltf) => {
            scene.add(gltf.scene);

            //모델 180도 회전
            gltf.scene.rotation.y = Math.PI;

            // 애니메이션 설정
            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(gltf.scene);
                const clip = gltf.animations[0]; // 첫 번째 애니메이션 클립 사용
                const action = mixer.clipAction(clip);

                action.loop = THREE.LoopOnce; // 한 번만 실행
                action.clampWhenFinished = true; // 마지막 프레임에서 멈춤
                action.paused = false; // 초기 상태에서 멈춤
                mixer   .addEventListener('finished', onAnimationFinished); 
            }

            // 최초 렌더링
            renderer.render(scene, camera);
        });
    }

    // 6. 애니메이션 종료 후 HTML 모달 표시
    function onAnimationFinished() {
        console.log("애니메이션 종료!");
        showModal(); // 애니메이션 종료 후 모달 창 띄우기
    }

    // 7. 모달 창 표시
    function showModal() {
        modal.style.display = "block"; // 모달을 화면에 표시
    }

    // 10. 모달 닫기
    function closeModal() {
        modal.style.display = "none"; // 모달 닫기
    }

    // 6. 꽃 모델 로드 및 최초 렌더링
    function loadFlowerModel() {
        loader = new GLTFLoader();
        loader.load("spring_rose_garden/scene.gltf", (gltf) => {
            scene.add(gltf.scene);

            
            gltf.scene.position.set(-5, 0, -1)

            // 최초 렌더링
            renderer.render(scene, camera);
        });
    }

    // 7. 마우스 컨트롤
    function setOrbitControls(){
        // OrbitControls를 추가합니다.
        let controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // 부드러운 회전을 위한 damping 활성화
        controls.dampingFactor = 0.25;
    }

    // 7. 마우스 클릭 핸들러
    function setupClickHandler() {
        window.addEventListener("click", (event) => {
            // 마우스 위치를 정규화된 디바이스 좌표(-1 ~ 1)로 변환
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
            // Raycaster 설정
            raycaster.setFromCamera(mouse, camera);
    
            // Raycaster가 교차하는 객체 확인
            const intersects = raycaster.intersectObjects(scene.children, true); // true: 자식 포함
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
    
                // 클릭된 객체가 모델이면 애니메이션 실행
                if (mixer) {
                    mixer.stopAllAction(); // 이전 애니메이션 정지
                    const clip = mixer.clipAction(mixer._actions[0]._clip); // 첫 번째 애니메이션 클립
                    clip.reset(); // 초기 상태로 재설정
                    clip.paused = false; // 정지 해제
                    clip.play(); // 애니메이션 실행
                }
            }
        });
    }
    

    // 8. 창 크기 변경 이벤트
    function setupResizeHandler() {
        window.addEventListener("resize", () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }



    // 9. 애니메이션 루프
    function animate() {
        const clock = new THREE.Clock();

        function render() {
            const delta = clock.getDelta();

            // 애니메이션 업데이트
            if (mixer) mixer.update(delta);

            // 씬 렌더링
            renderer.render(scene, camera);

            // 루프 반복
            requestAnimationFrame(render);
        }

        render();
    }

    // 10. 초기화 및 실행
    function main() {
        initScene();
        initCamera();
        initRenderer();
        initLights();
        loadPostBoxModel();
        loadFlowerModel();
        setupResizeHandler();
        setupClickHandler();
        setOrbitControls();
        animate();
    }

    /**
     * 애니메이션 실행 함수
    */
    function startAnimation() {
        if (action) {
            action.reset(); // 애니메이션 상태 초기화
            action.paused = false; // 멈춘 상태 해제
            action.play(); // 애니메이션 실행
        }
    }

    /**
     * 애니메이션 정지 함수
    */
    function stopAnimation() {
        if (action) {
            action.stop(); // 애니메이션 정지
        }
    }

    // 실행
    main();