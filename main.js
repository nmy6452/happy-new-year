import * as THREE from 'three';
import { GLTFLoader } from "GLTFLoader";
import { FontLoader } from "FontLoader";
import { OrbitControls } from 'OrbitControls';
import { TextGeometry } from 'TextGeometry';
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
    let action = null;
    const modal = document.getElementById('myModal'); // HTML 모달
    let isAnimation = false;
    let i = 0;


    //애니메이션 관련 전역 변수 선언
    let moveZ = 0; // Track x position
    let rotateCompleted = false;
    let moveCamera = false;
    let isAnimationFInished = false;

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
            55,
            window.innerWidth / window.innerHeight,
            0.3,
            1000
        );
        camera.position.set(-0.3, 1, 3);
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
        // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        pointLight.position.set(50, 50, 50);
        scene.add(pointLight);
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
        ground.position.y = -0.5; // 바닥 높이 설정 (기준 높이 0)
        
        // 씬에 바닥 추가
        scene.add(ground);

        loader = new GLTFLoader();
        loader.load("grass_vegitation_mix/scene.gltf", (gltf) => {
            scene.add(gltf.scene);

            
            gltf.scene.position.set(0, -0.5, 0)

            // 최초 렌더링
            renderer.render(scene, camera);
        });
    }


    // 6. 우체통 모델 로드 및 최초 렌더링
    function loadPostBoxModel() {
        loader = new GLTFLoader();
        loader.load("postbox/scene.gltf", (gltf) => {
            
            postbox = gltf.scene;
            scene.add(postbox);

            //모델 180도 회전
            postbox.rotation.y = Math.PI;
            postbox.position.set(0, -0.5, 0);

            // 애니메이션 설정
            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(postbox);
                const clip = gltf.animations[0]; // 첫 번째 애니메이션 클립 사용
                action = mixer.clipAction(clip);

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

    function textLoder(){
        // 글꼴 로드 및 3D 텍스트 생성
        loader = new FontLoader();
        loader.load('fonts/Do Hyeon_Regular.json', (font) => {
            const textHappyNewYear = new TextGeometry('Happy\n New Year', {
                font: font, // 로드한 글꼴 사용
                size: 0.1,    // 텍스트 크기
                height: 0.01, // 텍스트 깊이
                curveSegments: 5, // 곡선 세그먼트 (매끄러움)
                bevelEnabled: true, // 경사면 활성화
                bevelThickness: 0.03, // 경사면 두께
                bevelSize: 0.01, // 경사면 크기
                bevelSegments: 5, // 경사면 세그먼트
            });

            const urlParams = new URLSearchParams(window.location.search);
            const recipient = urlParams.get("recipient");
            let textToContent = "소중한\n 당신에게"
            if(recipient){
                textToContent = "TO. "+recipient;
            }

            const textTo = new TextGeometry(textToContent, {
                font: font, // 로드한 글꼴 사용
                size: 0.1,    // 텍스트 크기
                height: 0.02, // 텍스트 깊이
                curveSegments: 5, // 곡선 세그먼트 (매끄러움)
                bevelEnabled: true, // 경사면 활성화
                bevelThickness: 0.03, // 경사면 두께
                bevelSize: 0.01, // 경사면 크기
                bevelSegments: 5, // 경사면 세그먼트
            });

            const textYear = new TextGeometry("2025", {
                font: font, // 로드한 글꼴 사용
                size: 0.1,    // 텍스트 크기
                height: 0.02, // 텍스트 깊이
                curveSegments: 5, // 곡선 세그먼트 (매끄러움)
                bevelEnabled: true, // 경사면 활성화
                bevelThickness: 0.03, // 경사면 두께
                bevelSize: 0.01, // 경사면 크기
                bevelSegments: 5, // 경사면 세그먼트
            });

            // 텍스트 재질
            const textMaterial = new THREE.MeshStandardMaterial({ color: 0xF4F482 }); // HappyNewYear
            const textToMaterial = new THREE.MeshStandardMaterial({ color: 0xF4AFAB }); // To
            const textYearMaterial = new THREE.MeshStandardMaterial({ color: 0xF4EEA9 }); // 2025            
            
            const textHappyNewYearMesh = new THREE.Mesh(textHappyNewYear, textMaterial);
            const textToMesh = new THREE.Mesh(textTo, textToMaterial);
            const textYearMesh = new THREE.Mesh(textYear, textYearMaterial);

            // 텍스트 위치 조정
            textHappyNewYearMesh.position.set(-0.6, 0.2, -0.2); // 화면 중앙으로 이동
            textToMesh.position.set(0.3, 0.3, -0.1); // 화면 중앙으로 이동
            textYearMesh.position.set(-0.7, 0.32, -0.2)

            scene.add(textHappyNewYearMesh); // 씬에 추가
            scene.add(textToMesh); // 씬에 추가
            scene.add(textYearMesh); // 씬에 추가
        });
    }

    // 7. 모달 창 표시
    function showModal() {

        const urlParams = new URLSearchParams(window.location.search);
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
            modalContent[0].style.top = "10vh"; // 애니메이션으로 중앙으로 이동
        }, 3000); // 약간의 지연을 줘야 transition이 적용됨
        
        // 모달 닫기
        closeModalBtn.addEventListener("click", closeContentModal);
        modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeContentModal();
            reset();
        }
        });

        // 모달 닫기 함수
        function closeContentModal() {
            reset();
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

        setTimeout(() => {
            modal.style.display = "block"; // 모달 오버레이 보이기
            modalContent[1].style.top = "10vh"; // 애니메이션으로 중앙으로 이동
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
            reset();
            modalContent[1].style.top = "-100%"; // 다시 위로 이동
            setTimeout(() => {
                modal.style.display = "none"; // 모달 완전히 숨김
                // isAnimation = false
            }, 500); // 애니메이션 지속 시간과 동일하게 설정
        }
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
            latter.position.set(0,0.6,0)
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
                for (let i = 0; i < intersects.length; i++) {
                    const clickedObject = intersects[i].object;
    
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

    function reset(){

        //편지 위치 리셋
        latter.scale.set(0.2,0.2,0.2)
        latter.position.set(0,0.6,0)
        latter.rotation.x = THREE.MathUtils.degToRad(0);
        latter.rotation.y = THREE.MathUtils.degToRad(0);
        latter.rotation.z = THREE.MathUtils.degToRad(90);

        //애니메이션 리셋
        moveZ = 0; // Track x position
        rotateCompleted = false;
        moveCamera = false;
        isAnimationFInished = false;

        //우체통 애니메이션 리셋
        // mixer = new THREE.AnimationMixer(postbox);
        // const clip = gltf.animations[0]; // 첫 번째 애니메이션 클립 사용
        // action = mixer.clipAction(clip);

        // action.loop = THREE.LoopOnce; // 한 번만 실행
        // action.clampWhenFinished = true; // 마지막 프레임에서 멈춤
        // action.paused = false; // 초기 상태에서 멈춤
        // mixer.addEventListener('finished', onAnimationFinished); 

        isAnimation = false;
        action.reset(); // 애니메이션 리셋 (타임라인 초기화)
        action.stop(); // 초기 상태에서 멈춤
    }

    // 10. 초기화 및 실행
    function main() {
        initScene();
        initCamera();
        initRenderer();
        initLights();
        loadGround();
        loadPostBoxModel();
        textLoder();
        loadLetterModel();
        loadPointsMaterial();
        setupResizeHandler();
        setupClickHandler();
        setOrbitControls();
        animate();
    }
    
        // Animation loop
        function animateLatter() {
            if(isAnimationFInished) return;

            requestAnimationFrame(animateLatter);

            // Step 1: Move cube along x-axis
            if (moveZ < 0.5) {
                latter.position.z += 0.02; // Move 0.05 units per frame
                moveZ += 0.02;
            } 
            // Step 2: Rotate cube 180 degrees
            else if (!rotateCompleted) {
                latter.rotation.z -= Math.PI / 45; // Rotate 2 degrees per frame
                latter.rotation.y += Math.PI / 90; // Rotate 2 degrees per frame

                if (latter.rotation.z <= THREE.MathUtils.degToRad(-90)) {
                    latter.rotation.z = THREE.MathUtils.degToRad(-90); // Ensure exact rotation
                    rotateCompleted = true;
                    moveCamera = true;
                    isAnimationFInished = true;
                }
            } 
            // Step 3: Move camera along -z direction
            // else if (moveCamera && camera.position.z > 5) {
                // camera.position.z -= 0.05; // Move 0.05 units per frame
            // }
    
            renderer.render(scene, camera);
        }
    
        // Start animation
        // animateLatter();

    // 실행
    main();