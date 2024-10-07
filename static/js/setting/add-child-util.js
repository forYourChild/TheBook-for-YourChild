document.addEventListener('DOMContentLoaded', function () {
    const tagInput = document.getElementById('favorite-tags');
    const tagContainer = document.getElementById('tag-container');
    let tags = [];

    inputEvent()

    // Function to render tags
    function renderTags() {
        tagContainer.innerHTML = '';
        tags.forEach((tag, index) => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.innerHTML = `${tag} <button class="remove-tag" data-index="${index}">&times;</button>`;
            tagContainer.appendChild(tagElement);
        });

        // Attach event listeners to remove buttons
        document.querySelectorAll('.remove-tag').forEach(button => {
            button.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                tags.splice(index, 1);
                renderTags();
            });
        });
    }

    // Add tag on enter or space, only if it starts with '#'
    tagInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const tag = tagInput.value.trim();
            if (tag.startsWith('#') && !tags.includes(tag)) {
                tags.push(tag);
                renderTags();
            }
            tagInput.value = '';
        }
    });

    // Image preview functionality
    const childImageInput = document.getElementById('child-image');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewImg = document.getElementById('image-preview-img');
    const imagePreviewText = document.getElementById('image-preview-text');

    // Function to load and preview image
    function loadPreview(file) {
        const reader = new FileReader();
        imagePreviewText.style.display = 'none';
        imagePreviewImg.style.display = 'block';

        reader.addEventListener('load', function () {
            imagePreviewImg.setAttribute('src', this.result);
        });

        reader.readAsDataURL(file);
    }

    // Handle file input change event
    childImageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            loadPreview(file);
        } else {
            imagePreviewText.style.display = 'block';
            imagePreviewImg.style.display = 'none';
            imagePreviewImg.setAttribute('src', '');
        }
    });

    // Click to open file selector
    imagePreview.addEventListener('click', function () {
        childImageInput.click();
    });

    // Drag and drop functionality with highlighting effect
    imagePreview.addEventListener('dragenter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        imagePreview.classList.add('dragging');  // 박스 강조
    });

    imagePreview.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        imagePreview.classList.add('dragging');  // 박스 강조
    });

    imagePreview.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        imagePreview.classList.remove('dragging');  // 박스 강조 제거
    });

    imagePreview.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        imagePreview.classList.remove('dragging');  // 드롭 후 강조 제거

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            loadPreview(files[0]);
            childImageInput.files = files;  // 파일을 input에 설정
        }
    });
});

function inputEvent() {
    const childName = document.getElementById('child-name');
    const childGender = document.getElementById('child-gender');
    const favoriteTags = document.getElementById('favorite-tags');
    const childCharacteristic = document.getElementById('child-characteristics')
    const childImage = document.getElementById('child-image')

    childName.addEventListener("focus", function() {
        document.getElementById("child-name-group").classList.add("active");
    });

    childName.addEventListener("blur", function() {
        document.getElementById("child-name-group").classList.remove("active");
    });

    childGender.addEventListener("focus", function() {
        document.getElementById("child-gender-group").classList.add("active");
    });

    childGender.addEventListener("blur", function() {
        document.getElementById("child-gender-group").classList.remove("active");
    });

    favoriteTags.addEventListener("focus", function() {
        document.getElementById("child-favorite-group").classList.add("active");
    });

    favoriteTags.addEventListener("blur", function() {
        document.getElementById("child-favorite-group").classList.remove("active");
    });

    childCharacteristic.addEventListener("focus", function() {
        document.getElementById("child-characteristics-group").classList.add("active");
    });

    childCharacteristic.addEventListener("blur", function() {
        document.getElementById("child-characteristics-group").classList.remove("active");
    });

    childImage.addEventListener("focus", function() {
        document.getElementById("child-image-group").classList.add("active");
    });

    childImage.addEventListener("blur", function() {
        document.getElementById("child-image-group").classList.remove("active");
    });
}