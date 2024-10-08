document.addEventListener('DOMContentLoaded', function () {
    const registerChildBtn = document.getElementById('register-child-btn');
    const childName = document.getElementById('child-name');
    const childGender = document.getElementById('child-gender');
    const favoriteTags = document.getElementById('favorite-tags');
    const tagContainer = document.getElementById('tag-container');
    const childCharacteristics = document.getElementById('child-characteristics');
    const childImageInput = document.getElementById('child-image');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewImg = document.getElementById('image-preview-img');
    const imagePreviewText = document.getElementById('image-preview-text');

    let isNameValid = false;
    let isGenderValid = false;
    let isTagsValid = false;
    let isCharacteristicsValid = false;
    let isImageValid = false;
    let tags = [];
    let isSubmitAttempted = false;

    // Add input event listeners for real-time validation
    childName.addEventListener('input', function () {
        isNameValid = childName.value.trim() !== '';
        updateSubmitButtonState();  // 실시간으로 버튼 활성화 여부 결정
    });

    childGender.addEventListener('change', function () {
        isGenderValid = childGender.value !== '';
        updateSubmitButtonState();
    });

    favoriteTags.addEventListener('input', function () {
        isTagsValid = tags.length > 0;
        updateSubmitButtonState();
    });

    childCharacteristics.addEventListener('input', function () {
        isCharacteristicsValid = childCharacteristics.value.trim() !== '';
        updateSubmitButtonState();
    });

    childImageInput.addEventListener('change', handleImageUpload);  // 이미지 업로드 이벤트 추가

    // 이미지 파일 유효성 검사 및 미리보기
    function handleImageUpload() {
        const file = childImageInput.files[0];
        if (file && isImageFile(file)) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreviewImg.src = e.target.result;
                imagePreviewImg.style.display = 'block';
                imagePreviewText.style.display = 'none';
            };
            reader.readAsDataURL(file);
            isImageValid = true;  // 이미지가 유효하면 true로 설정
        } else {
            imagePreviewImg.style.display = 'none';
            imagePreviewText.style.display = 'block';
            isImageValid = false;  // 이미지가 유효하지 않으면 false로 설정
        }
        if (isSubmitAttempted) {
            updateFieldState(childImageInput, isImageValid);
        }
        updateSubmitButtonState();
    }

    // 태그 렌더링 함수
    function renderTags() {
        tagContainer.innerHTML = '';
        tags.forEach((tag, index) => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.innerHTML = `${tag} <button class="remove-tag" data-index="${index}">&times;</button>`;
            tagContainer.appendChild(tagElement);
        });

        // 태그 삭제 버튼 이벤트
        document.querySelectorAll('.remove-tag').forEach(button => {
            button.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                tags.splice(index, 1);
                renderTags();
            });
        });

        isTagsValid = tags.length > 0;
    }

    // 태그 입력 필드 이벤트
    favoriteTags.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const tag = favoriteTags.value.trim();
            if (tag.startsWith('#') && !tags.includes(tag)) {
                tags.push(tag);
                renderTags();
            }
            favoriteTags.value = '';
        }
    });

    // 파일이 이미지인지 검사하는 함수
    function isImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        return allowedTypes.includes(file.type);
    }

    // 필드가 유효한지 설정하는 헬퍼 함수
    function updateFieldState(element, isValid) {
        if (isSubmitAttempted && !isValid) {
            element.closest('.input-group').style.border = '2px solid red';
        } else {
            element.closest('.input-group').style.border = '';
        }
    }

    // 모든 필드가 유효한지 확인 후 버튼 활성화 여부 결정
    function updateSubmitButtonState() {
        const allValid = isNameValid && isGenderValid && isTagsValid && isCharacteristicsValid && isImageValid;
        registerChildBtn.disabled = !allValid;
    }

    // 버튼 클릭 시 모든 필드 검증 및 POST 요청
    registerChildBtn.addEventListener('click', function () {
        isSubmitAttempted = true;
        validateAllFields();

        if (isNameValid && isGenderValid && isTagsValid && isCharacteristicsValid && isImageValid) {
            sendChildInfoPost();
        }
    });

    // 모든 필드를 검사하는 함수
    function validateAllFields() {
        isNameValid = childName.value.trim() !== '';
        isGenderValid = childGender.value !== '';
        isTagsValid = tags.length > 0;
        isCharacteristicsValid = childCharacteristics.value.trim() !== '';
        isImageValid = childImageInput.files.length > 0;

        updateFieldState(childName, isNameValid);
        updateFieldState(childGender, isGenderValid);
        updateFieldState(favoriteTags, isTagsValid);
        updateFieldState(childCharacteristics, isCharacteristicsValid);
        updateFieldState(childImageInput, isImageValid);
    }

    // CSRF 토큰을 가져오는 함수
    function getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    function sendChildInfoPost() {
        const formData = new FormData();
        formData.append('name', childName.value.trim());
        formData.append('gender', childGender.value);
        formData.append('tags', tags.join(','));  // 태그는 문자열로 변환해서 보냄
        formData.append('characteristics', childCharacteristics.value.trim());
        formData.append('image', childImageInput.files[0]);  // 파일도 FormData에 추가
    
        fetch('/setting/addchild', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': getCSRFToken()  // CSRF 토큰을 포함
            },
            body: formData  // FormData 객체 전송
        })
        .then(response => response.json())
        .then(data => {
            if (data.resultCode === 200) {
                alert('Child registered successfully!');
                window.location.href = '/setting/stchildadd';
            } else {
                alert(data.resultMsg || 'Failed to register the child. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    }
    
});
