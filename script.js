const splash = document.getElementById('splash');
const mainContent = document.getElementById('main-content');
const slots = document.querySelectorAll('.slot');

const CLOUDINARY_CLOUD_NAME = 'dsaxcy1sm';
const CLOUDINARY_UPLOAD_PRESET = 'business';
const JSONBIN_BIN_ID = '68df382743b1c97be95889d1';
const JSONBIN_API_KEY = '$2a$10$qWk39lnjY9SiWVhoQfD46eRhr0RfoeCog/5LazFm7xRkWsdHTIxSW';

window.addEventListener('load', () => {
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.classList.add('hidden');
            mainContent.classList.remove('hidden');
            loadData();
        }, 2000);
    }, 2000);
});

// Handle Cloudinary upload, remove, link input
slots.forEach((slot, index) => {
    const uploadBtn = slot.querySelector('.upload-btn');
    const removeBtn = slot.querySelector('.remove-btn');
    const linkInput = slot.querySelector('.link-input');
    const imgTag = slot.querySelector('img');

    uploadBtn.addEventListener('click', async () => {
        const file = document.createElement('input');
        file.type = 'file';
        file.accept = 'image/*';
        file.click();
        file.onchange = async () => {
            const formData = new FormData();
            formData.append('file', file.files[0]);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            imgTag.src = data.secure_url;
            saveData(index, data.secure_url, linkInput.value);
        };
    });

    removeBtn.addEventListener('click', () => {
        imgTag.src = '';
        linkInput.value = '';
        saveData(index, '', '');
    });

    linkInput.addEventListener('change', () => {
        saveData(index, imgTag.src, linkInput.value);
    });
});

// JSONBin persistence
async function saveData(index, img, link) {
    const existing = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    const json = await existing.json();
    let data = json.record || [];
    data[index] = { img, link };
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_API_KEY
        },
        body: JSON.stringify(data)
    });
}

// Load saved images & links
async function loadData() {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    const data = (await res.json()).record || [];
    data.forEach((item, index) => {
        if (item) {
            slots[index].querySelector('img').src = item.img || '';
            slots[index].querySelector('.link-input').value = item.link || '';
        }
    });
}
