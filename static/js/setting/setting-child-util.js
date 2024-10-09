document.addEventListener('DOMContentLoaded', function () {
    const childListContainer = document.getElementById('child-list');
    const noChildrenMessage = document.getElementById('no-children-message');
    
    // 모달 관련 요소 가져오기
    const modal = document.getElementById('child-modal');
    const modalPhoto = document.getElementById('modal-photo');
    const modalName = document.getElementById('modal-name');
    const modalGender = document.getElementById('modal-gender');
    const modalLikes = document.getElementById('modal-likes');
    const modalCharacteristics = document.getElementById('modal-characteristics');
    const modalClose = document.querySelector('.modal-close');

    // 모달 닫기 기능
    modalClose.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // 모달 창 외부 클릭 시 닫기
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 서버에서 아이 목록을 가져오는 함수
    function fetchChildren() {
        fetch('/setting/getchildlist', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRF-TOKEN': getCSRFToken()  // 필요한 경우 CSRF 토큰 추가
            }
        })
        .then(response => response.json())
        .then(data => {
            renderChildren(data.children);
        })
        .catch(error => {
            console.error('Error fetching children:', error);
            noChildrenMessage.style.display = 'block';  // 에러 시 기본 메시지 표시
        });
    }

    // 아이를 클릭할 때 모달을 여는 함수
    function openChildModal(child) {
        modalPhoto.src = child.image;
        modalName.textContent = child.name;
        
        // 성별 아이콘 설정
        let genderIcon = '';
        if (child.gender === 'M') {
            genderIcon = `<span class="material-icons">male</span>`;
        } else if (child.gender === 'F') {
            genderIcon = `<span class="material-icons">female</span>`;
        } else {
            genderIcon = `<span class="material-icons">transgender</span>`;
        }
        modalGender.innerHTML = genderIcon;

        // 좋아하는 것 표시
        modalLikes.innerHTML = child.likes.map(like => `<span>${like}</span>`).join('');

        // 특징 표시
        modalCharacteristics.textContent = child.characteristics;

        modal.style.display = 'flex';  // 모달을 보여줌
    }

    function renderChildren(children) {
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

            // Inner HTML 구조 수정
            childCard.innerHTML = `
                <img src="${child.image}" alt="${child.name}'s photo" class="child-photo">
                <div class="child-info">
                    <h2>${child.name}</h2>
                    <div class="child-gender">${genderIcon}</div>
                </div>
                <div class="child-likes">
                    ${child.likes.map(like => `<span class="like-tag">${like}</span>`).join('')}
                </div>
                <div class="child-characteristics" title="${child.characteristics}">
                    ${truncateText(child.characteristics, 100)} <!-- 길이를 제한하는 함수 -->
                </div>
            `;

            // 아이 카드를 클릭했을 때 모달을 여는 이벤트 리스너 추가
            childCard.addEventListener('click', function () {
                openChildModal(child);  // 아이 정보를 모달로 전달하여 표시
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

    // CSRF 토큰을 가져오는 함수 (필요한 경우)
    function getCSRFToken() {
        return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    }

    // 페이지가 로드될 때 아이 목록을 가져옴
    fetchChildren();
});
