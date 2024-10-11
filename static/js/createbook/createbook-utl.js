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
    const generateStorybookBtn = document.getElementById('generate-storybook-btn');
    
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

        // Hide Next button if on the last step
        if (currentStep === steps.length - 1) {
            nextStepMainBtn.style.display = 'none';
        } else {
            nextStepMainBtn.style.display = 'block';
        }
    }

    // 입력할 때마다 높이를 자동으로 조정 및 최대 글자수 제한
    textarea.addEventListener('input', function () {
        if (textarea.value.length > 100) {
            textarea.value = textarea.value.substring(0, 100); // 최대 글자수 초과시 잘라냄
        }
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    // Handle Previous and Next Step Navigation
    prevStepBtn.addEventListener('click', function () {
        if (currentStep > 0) {
            currentStep--;
            updateStepVisibility();
        }
    });

    nextStepBtn.addEventListener('click', function () {
        if (currentStep < steps.length - 1 && validateCurrentStep()) {
            currentStep++;
            updateStepVisibility();
        }
    });

    nextStepMainBtn.addEventListener('click', function () {
        if (currentStep < steps.length - 1 && validateCurrentStep()) {
            currentStep++;
            updateStepVisibility();
        }
    });

    // 각 단계를 이동할 때 유효성 검사 수행
    function validateCurrentStep() {
        let isValid = true;

        if (currentStep === 0 && !selectedChild) {
            warningModal.style.display = 'flex';
            isValid = false;
        }

        if (currentStep === 1 && teachingContentInput.value.trim() === '') {
            document.getElementById('teaching-group').style.border = '2px solid red';
            isValid = false;
        } else {
            document.getElementById('teaching-group').style.border = '';
        }

        return isValid;
    }

    // 서버로 데이터 전송
    generateStorybookBtn.addEventListener('click', function () {
        if (validateCurrentStep()) {
            const data = {
                child: selectedChild,
                teachingContent: teachingContentInput.value
            };

            fetch('/createbook/generate-storybook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCSRFToken()
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                // 서버로부터 응답 처리
                console.log('Success:', data);
                alert('Storybook generated successfully!');
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Failed to generate storybook.');
            });
        }
    });

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

            let genderIcon = child.gender === 'M' ? 'male' : child.gender === 'F' ? 'female' : 'transgender';
            childCard.innerHTML = `
                <img src="${child.image}" alt="${child.name}'s photo" class="child-photo">
                <div class="child-info">
                    <h2 id='child-name'>${child.name}</h2>
                    <div class="child-gender"><span class="material-icons">${genderIcon}</span></div>
                </div>
                <div class="child-likes">
                    ${child.likes.map(like => `<span class="like-tag">${like}</span>`).join('')}
                </div>
                <div class="child-characteristics" title="${child.characteristics}">
                    ${truncateText(child.characteristics, 100)}
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

        const selectedCard = Array.from(document.querySelectorAll('.child-card')).find(card => {
            return card.querySelector('h2').innerText === childName;
        });

        if (selectedCard) {
            selectedCard.classList.add('selected');
            selectedChild = childName;
            document.getElementById('child-list').style.border = ''; // 경고 제거
        }
    }

    // CSRF Token function
    function getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    closeModalBtn.addEventListener('click', function () {
        warningModal.style.display = 'none';
    });

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
