document.addEventListener('DOMContentLoaded', function () {
    const steps = [
        document.getElementById('child-selection-section'),
        document.getElementById('teaching-input-section'),
        document.getElementById('generate-button-section')
    ];

    const currentStepElem = document.getElementById('current-step');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const nextStepMainBtn = document.getElementById('next-step-main-btn');
    const warningModal = document.getElementById('warning-modal');
    const closeModalBtn = document.querySelector('.modal-close');
    const textarea = document.getElementById('teaching-input');
    let currentStep = 0;

    // 아이 선택 상태 및 가르치고자 하는 내용 상태를 추적
    let selectedChild = null;
    const teachingContentInput = document.getElementById('teaching-input'); // 가르치고자 하는 내용 입력란

    // Function to update step visibility
    function updateStepVisibility() {
        // 각 단계별 섹션을 모두 숨김
        steps.forEach((step, index) => {
            step.style.display = (index === currentStep) ? 'block' : 'none';
        });

        // Update step indicator text (단계 표시를 업데이트)
        currentStepElem.textContent = `Step ${currentStep + 1} of ${steps.length}`;

        // Enable/Disable navigation buttons (버튼 활성화/비활성화 설정)
        prevStepBtn.disabled = currentStep === 0;
        nextStepBtn.disabled = currentStep === steps.length - 1;
    }

    // 입력할 때마다 높이를 자동으로 조정 및 최대 글자수 제한
    textarea.addEventListener('input', function () {
        // 최대 글자 수 100자로 제한
        if (textarea.value.length > 100) {
            textarea.value = textarea.value.substring(0, 100); // 최대 글자수 초과시 잘라냄
        }

        // 스크롤 높이만큼 높이를 자동으로 늘림
        textarea.style.height = 'auto';  // 높이를 초기화한 후
        textarea.style.height = textarea.scrollHeight + 'px';  // 스크롤 높이에 맞춰 자동으로 높이 조절
    });

    // Function to update step visibility
    function updateStepVisibility() {
        steps.forEach((step, index) => {
            step.style.display = (index === currentStep) ? 'block' : 'none';
        });

        // Update step indicator text
        currentStepElem.textContent = `Step ${currentStep + 1} of ${steps.length}`;

        // Enable/Disable navigation buttons
        prevStepBtn.disabled = currentStep === 0;
        nextStepBtn.disabled = currentStep === steps.length - 1;

        // Hide Next button if on the last step
        if (currentStep === steps.length - 1) {
            nextStepMainBtn.style.display = 'none'; // Hide Next button on the last step
        } else {
            nextStepMainBtn.style.display = 'block'; // Show Next button otherwise
        }
    }

    // Handle Previous and Next Step Navigation
    prevStepBtn.addEventListener('click', function () {
        if (currentStep < steps.length - 1) {
            if (validateCurrentStep()) {
                currentStep++;
                updateStepVisibility();
            }
        }
    });

    nextStepBtn.addEventListener('click', function () {
        if (currentStep < steps.length - 1) {
            if (validateCurrentStep()) {
                currentStep++;
                updateStepVisibility();
            }
        }
    });

    document.getElementById('next-step-main-btn').addEventListener('click', function () {
        if (currentStep < steps.length - 1) {
            if (validateCurrentStep()) {
                currentStep++;
                updateStepVisibility();
            }
        }
    });

    // 각 단계를 이동할 때 유효성 검사 수행
    function validateCurrentStep() {
        let isValid = true;

        if (currentStep === 0) {  // Step 1: 아이 선택
            if (!selectedChild) {
                warningModal.style.display = 'flex';  // 경고 팝업 표시
                isValid = false;
            }
        }

        if (currentStep === 1) {  // Step 2: 가르치고자 하는 내용 입력
            if (teachingContentInput.value.trim() === '') {
                document.getElementById('teaching-group').style.border = '2px solid red';
                isValid = false;
            } else {
                document.getElementById('teaching-group').style.border = ''; // 경고 제거
            }
        }

        return isValid;
    }

    // Fetch children and render them in the list
    function fetchChildren() {
        fetch('/setting/getchildlist', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRF-TOKEN': getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.children && data.children.length > 0) {
                renderChildren(data.children);
            } else {
                document.getElementById('no-children-message').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching children:', error);
            document.getElementById('no-children-message').style.display = 'block';
        });
    }

    // Render children list
    function renderChildren(children) {
        const childListContainer = document.getElementById('child-list');
        children.forEach(child => {
            const childCard = document.createElement('div');
            childCard.classList.add('child-card');
    
            let genderIcon = '';
            if (child.gender === 'M') {
                genderIcon = `<span class="material-icons gender-icon">male</span>`;
            } else if (child.gender === 'F') {
                genderIcon = `<span class="material-icons gender-icon">female</span>`;
            } else {
                genderIcon = `<span class="material-icons gender-icon">transgender</span>`;
            }

            childCard.innerHTML = `
                <img src="${child.image}" alt="${child.name}'s photo" class="child-photo">
                <div class="child-info">
                    <h2 id='child-name'>${child.name}</h2>
                    <div class="child-gender">${genderIcon}</div>
                </div>
                <div class="child-likes">
                    ${child.likes.map(like => `<span class="like-tag">${like}</span>`).join('')}
                </div>
                <div class="child-characteristics" title="${child.characteristics}">
                    ${truncateText(child.characteristics, 100)} <!-- 길이를 제한하는 함수 -->
                </div>
            `;

            childCard.addEventListener('click', function () {
                selectChild(child.name);  // 아이 선택
            });

            childListContainer.appendChild(childCard);
        });
    }

    // 텍스트를 특정 길이로 제한하고 '...' 추가
    function truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        } else {
            return text;
        }
    }

    // 아이 선택 함수
    function selectChild(childName) {
        document.querySelectorAll('.child-card').forEach(card => {
            card.classList.remove('selected');
        });

        // 선택된 아이를 가진 요소 찾기
        const selectedCard = Array.from(document.querySelectorAll('.child-card')).find(card => {
            return card.querySelector('h2').innerText === childName;
        });

        // 선택된 카드가 있으면 class 추가, 없으면 경고
        if (selectedCard) {
            selectedCard.classList.add('selected');
            selectedChild = childName;
            document.getElementById('child-list').style.border = ''; // 경고 제거
        } else {
            console.error('Selected child not found.');
        }
    }

    // CSRF Token function
    function getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    // 팝업 닫기 버튼 동작
    closeModalBtn.addEventListener('click', function () {
        warningModal.style.display = 'none';
    });

    // 팝업 외부 클릭 시 팝업 닫기
    window.addEventListener('click', function (event) {
        if (event.target === warningModal) {
            warningModal.style.display = 'none';
        }
    });

    // Initialize fetching children
    fetchChildren();

    // Initialize step visibility
    updateStepVisibility();
});
