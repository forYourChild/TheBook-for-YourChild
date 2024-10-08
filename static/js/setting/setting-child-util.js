document.addEventListener('DOMContentLoaded', function () {
    const childListContainer = document.getElementById('child-list');
    const noChildrenMessage = document.getElementById('no-children-message');

    // 사이드바 토글 이벤트 리스너 추가
    document.getElementById('profile-icon').addEventListener('click', function () {
        document.getElementById('sidebar').style.width = '300px';
        document.getElementById('overlay').style.display = 'block';
    });

    document.getElementById('close-sidebar').addEventListener('click', function () {
        document.getElementById('sidebar').style.width = '0';
        document.getElementById('overlay').style.display = 'none';
    });

    document.getElementById('overlay').addEventListener('click', function () {
        document.getElementById('sidebar').style.width = '0';
        document.getElementById('overlay').style.display = 'none';
    });

    // 서버에서 아이 목록을 가져오는 함수
    function fetchChildren() {
        fetch('/setting/getchildlist', {  // 실제 API 경로로 수정
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

    function renderChildren(children) {
        children.forEach(child => {
            const childCard = document.createElement('div');
            childCard.classList.add('child-card');
    
            // 성별 아이콘 설정 (남성/여성/기타)
            let genderIcon = '';
            if (child.gender === 'M') {
                genderIcon = `<span class="material-icons gender-icon">male</span>`;
            } else if (child.gender === 'F') {
                genderIcon = `<span class="material-icons gender-icon">female</span>`;
            } else {
                genderIcon = `<span class="material-icons gender-icon">transgender</span>`;
            }
    
            // Inner HTML 구조를 수정하여 아이콘과 나머지 정보를 배치
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
                    ${truncateText(child.characteristics, 200)} <!-- 길이를 제한하는 함수 사용 -->
                </div>
            `;
    
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
