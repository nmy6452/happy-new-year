import * as THREE from 'three';
import { GLTFLoader } from "GLTFLoader";
import { OrbitControls } from 'OrbitControls';
//TODO 카메라 위치 고정 및 시작시 화면 설정 이동 제한설정
//TODO 애니매이션 종료 이후 이벤트 발생
//TODO 이쁜 편지지 제작
//TODO 꽃 모델변경
//TODO 클릭시 우체통을 클릭한 경우에만 이벤트 발생

    // 1. 전역 변수 선언
    let scene, camera, renderer, loader, mixer, postbox, latter;
    const controls = {
        isDragging: false,
        previousMousePosition: { x: 0, y: 0 },
        rotationSpeed: 0.005,
    };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const modal = document.getElementById('myModal'); // HTML 모달
    let isAnimation = false;
    let i = 0;


    //애니메이션 관련 전역 변수 선언
    let moveZ = 0; // Track x position
    let rotateCompleted = false;
    let moveCamera = false;

    // 원형 텍스처 생성
    const circleTexture = createCircleTexture();

    // 입자 재질 생성
    const particleMaterial = new THREE.PointsMaterial({
    color: 0xffcc00, // 반딧불 색상 (노란빛)
    size: 0.001,
    transparent: true,
    map: circleTexture, // 원형 텍스처 적용
    opacity: 0.8,
    blending: THREE.AdditiveBlending, // 빛이 섞이는 효과
    depthWrite: false,
    });

    // 입자 관련 번수
    let particles = null;
    const particleCount = 20; // 입자 개수
    
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

    // 6. 바닥 생성
    function loadGround() {
        // 바닥의 지오메트리 생성 (CircleGeometry 사용)
        const groundGeometry = new THREE.CircleGeometry(1.34, 64); // 반지름 5, 세그먼트 64개로 부드러운 원
        
        // 흙색(갈색) 재질 생성
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x0A0502, // 흙색 (갈색, Hex 코드)
            side: THREE.DoubleSide, // 양면 렌더링
        });
        
        // 원형 바닥 메시 생성
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // 바닥의 위치 조정
        ground.rotation.x = -Math.PI / 2; // 바닥을 수평으로 회전
        ground.position.y = 0; // 바닥 높이 설정 (기준 높이 0)
        
        // 씬에 바닥 추가
        scene.add(ground);

        loader = new GLTFLoader();
        loader.load("grass_vegitation_mix/scene.gltf", (gltf) => {
            scene.add(gltf.scene);

            
            // gltf.scene.position.set(-5, 0, -1)

            // 최초 렌더링
            renderer.render(scene, camera);
        });
    }


    // 6. 우체통 모델 로드 및 최초 렌더링
    function loadPostBoxModel() {
        loader = new GLTFLoader();
        loader.load("postbox/scene.gltf", (gltf) => {
            scene.add(gltf.scene);
            postbox = gltf.scene;

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
                mixer.addEventListener('finished', onAnimationFinished); 
            }

            // 최초 렌더링
            renderer.render(scene, camera);
        });
    }

    // 6. 애니메이션 종료 후 HTML 모달 표시
    function onAnimationFinished() {
        animateLatter();
        showModal();
    }

    // 7. 모달 창 표시
    function showModal() {

        const urlParams = new URLSearchParams(window.location.search);
        urlParams.forEach((value, key) => {
            console.log(`Key: ${key}, Value: ${value}`);
        });
        const title = urlParams.get("title");
        const recipient = urlParams.get("recipient");
        const content = urlParams.get("content");

        //보여줄 내용이 있는경우 보여주고 없는 경우 입력 
        if(title && content){
            showContentModal(title, content, recipient);
        }
        else{
            showInputModal();
        }

    }

    // 7. 내용 모달 창 표시
    function showContentModal(title, content, recipient) {
        // modal.style.display = "block"; // 모달을 화면에 표시

        // JavaScript 코드
        const modal = document.getElementById("contentModal");
        const modalContent = document.querySelectorAll(".modal-content");
        const closeModalBtn = document.getElementById("closeContentModal");

        $("#messageTitle").text(title);
        $("#messageRecipient").text("TO. "+recipient);
        $("#messageContent").text(content);
        

        setTimeout(() => {
            modal.style.display = "block"; // 모달 오버레이 보이기
            modalContent[0].style.top = "30%"; // 애니메이션으로 중앙으로 이동
        }, 3000); // 약간의 지연을 줘야 transition이 적용됨
        
        // 모달 닫기
        closeModalBtn.addEventListener("click", closeContentModal);
        modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeContentModal();
        }
        });

        // 모달 닫기 함수
        function closeContentModal() {
            modalContent[0].style.top = "-100%"; // 다시 위로 이동
            setTimeout(() => {
                modal.style.display = "none"; // 모달 완전히 숨김
                // isAnimation = false
            }, 500); // 애니메이션 지속 시간과 동일하게 설정
        }
    }

    // 7. 내용 모달 창 표시
    function showInputModal() {
        // modal.style.display = "block"; // 모달을 화면에 표시

        // JavaScript 코드
        const modal = document.getElementById("inputModal");
        const modalContent = document.querySelectorAll(".modal-content");
        const closeModalBtn = document.getElementById("closeInputModal");

        console.log(modalContent);

        setTimeout(() => {
            modal.style.display = "block"; // 모달 오버레이 보이기
            modalContent[1].style.top = "30%"; // 애니메이션으로 중앙으로 이동
        }, 3000); // 약간의 지연을 줘야 transition이 적용됨
        
        // 모달 닫기
        closeModalBtn.addEventListener("click", closeInputModal);
        modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeInputModal();
        }
        });

        // 모달 닫기 함수
        function closeInputModal() {
            modalContent[1].style.top = "-100%"; // 다시 위로 이동
            setTimeout(() => {
                modal.style.display = "none"; // 모달 완전히 숨김
                // isAnimation = false
            }, 500); // 애니메이션 지속 시간과 동일하게 설정
        }
    }

    // 6. 꽃 모델 로드 및 최초 렌더링
    function loadFlowerModel() {
        loader = new GLTFLoader();
        loader.load("grass_vegitation_mix/scene.gltf", (gltf) => {
            scene.add(gltf.scene);

            
            // gltf.scene.position.set(-5, 0, -1)

            // 최초 렌더링
            renderer.render(scene, camera);
        });
    }

    // 원형 텍스처 생성 함수
function createCircleTexture() {
    const size = 128; // 텍스처 크기
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
  
    const ctx = canvas.getContext('2d');
    const center = size / 2;
    const radius = size / 2;
  
    // 원형 그리기
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white'; // 텍스처의 알파 영역
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

    // 6. 반딧불이 효과
    function loadPointsMaterial() {
        // 반딧불 입자 시스템 생성
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 5; // X 좌표
        positions[i * 3 + 1] = (Math.random() - 0.5) * 5; // Y 좌표
        positions[i * 3 + 2] = (Math.random() - 0.5) * 5; // Z 좌표
        sizes[i] = Math.random() * 5 + 1; // 입자 크기
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        particles = new THREE.Points(particlesGeometry, particleMaterial);
        scene.add(particles);

        animateParticles();

    }

    // 애니메이션 효과
    function animateParticles() {
        requestAnimationFrame(animateParticles);

        // 반짝임 효과
        particleMaterial.size = Math.abs(Math.sin(Date.now() * 0.001)) * 0.1 + 0.05;

        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01; // Y축 이동
        positions[i * 3] += (Math.random() - 0.5) * 0.02; // X축 랜덤 이동
        positions[i * 3 + 2] += (Math.random() - 0.5) * 0.02; // Z축 랜덤 이동
        }
        particles.geometry.attributes.position.needsUpdate = true; // 위치 업데이트

        renderer.render(scene, camera);
    }
    
    // 6. 편지 모델 로드 및 최초 렌더링
    function loadLetterModel() {
        loader = new GLTFLoader();
        loader.load("letter_1/scene.gltf", (gltf) => {
            scene.add(gltf.scene);
            latter = gltf.scene;
            
            latter.scale.set(0.2,0.2,0.2)
            latter.position.set(0,1.1,0)
            latter.rotation.z = THREE.MathUtils.degToRad(90);

            
            // gltf.scene.position.set(-5, 0, -1)

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
    
                // 클릭된 객체가 우체통이고 애니메이션이 실행된적이 없다며 애니메이션 실행
                if(isAnimation == false && clickedObject.userData.name == "Box002_01 - Default_0"){
                    isAnimation = true;
                    if (mixer) {
                        mixer.stopAllAction(); // 이전 애니메이션 정지
                        const clip = mixer.clipAction(mixer._actions[0]._clip); // 첫 번째 애니메이션 클립
                        clip.reset(); // 초기 상태로 재설정
                        clip.paused = false; // 정지 해제
                        clip.play(); // 애니메이션 실행
                    }
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
        loadGround();
        loadPostBoxModel();
        // loadFlowerModel();
        loadLetterModel();
        loadPointsMaterial();
        setupResizeHandler();
        setupClickHandler();
        setOrbitControls();
        animate();
    }
    
        // Animation loop
        function animateLatter() {
          requestAnimationFrame(animateLatter);

          // Step 1: Move cube along x-axis
          if (moveZ < 0.5) {
            latter.position.z += 0.005; // Move 0.05 units per frame
            moveZ += 0.005;
          } 
          // Step 2: Rotate cube 180 degrees
          else if (!rotateCompleted) {
            latter.rotation.z -= Math.PI / 90; // Rotate 2 degrees per frame
            latter.rotation.y += Math.PI / 180; // Rotate 2 degrees per frame

            if (latter.rotation.z <= THREE.MathUtils.degToRad(-90)) {
                latter.rotation.z = THREE.MathUtils.degToRad(-90); // Ensure exact rotation
                rotateCompleted = true;
                moveCamera = true;
            }
          } 
          // Step 3: Move camera along -z direction
          else if (moveCamera && camera.position.z > 5) {
            camera.position.z -= 0.05; // Move 0.05 units per frame
          }
    
          renderer.render(scene, camera);
        }
    
        // Start animation
        // animateLatter();

    // 실행
    main();