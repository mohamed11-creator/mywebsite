const CLOUD_NAME = 'dsaxcy1sm';  // your Cloudinary cloud name
const UPLOAD_PRESET = 'business'; // your unsigned upload preset
const JSONBIN_ID = '68df382743b1c97be95889d1';
const JSONBIN_KEY = '$2a$10$qWk39lnjY9SiWVhoQfD46eRhr0RfoeCog/5LazFm7xRkWsdHTIxSW';

const splash = document.getElementById('splash');
const gallery = document.getElementById('gallery');
const slotsContainer = document.querySelector('.slots-container');

// Fade splash and show gallery
setTimeout(() => {
  splash.style.display = 'none';
  gallery.classList.remove('hidden');
}, 4000);

// Generate 24 slots
for (let i = 0; i < 24; i++) {
  const slot = document.createElement('div');
  slot.classList.add('slot');

  const img = document.createElement('img');
  img.src = '';
  slot.appendChild(img);

  const linkInput = document.createElement('input');
  linkInput.type = 'text';
  linkInput.placeholder = 'Enter link URL';
  slot.appendChild(linkInput);

  const addLinkBtn = document.createElement('button');
  addLinkBtn.textContent = 'Add/Edit Link';
  slot.appendChild(addLinkBtn);

  const uploadBtn = document.createElement('button');
  uploadBtn.textContent = 'Upload Image';
  slot.appendChild(uploadBtn);

  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  slot.appendChild(removeBtn);

  slotsContainer.appendChild(slot);

  // Upload image
  uploadBtn.onclick = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();

    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      img.src = data.secure_url;
      saveToJSONBin(i, data.secure_url, linkInput.value);
    };
  };

  // Add/Edit link
  addLinkBtn.onclick = () => {
    saveToJSONBin(i, img.src, linkInput.value);
  };

  // Remove image and link
  removeBtn.onclick = () => {
    img.src = '';
    linkInput.value = '';
    saveToJSONBin(i, '', '');
  };
}

// Load saved data from JSONBin
async function loadFromJSONBin() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
    headers: { 'X-Master-Key': JSONBIN_KEY }
  });
  const data = await res.json();
  const record = data.record || [];

  record.forEach((item, index) => {
    const slot = slotsContainer.children[index];
    if (!slot) return;
    slot.querySelector('img').src = item.img || '';
    slot.querySelector('input').value = item.link || '';
  });
}

// Save data to JSONBin
async function saveToJSONBin(index, imgURL, linkURL) {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
    headers: { 'X-Master-Key': JSONBIN_KEY }
  });
  const data = await res.json();
  const record = data.record || Array(24).fill({ img: '', link: '' });
  record[index] = { img: imgURL, link: linkURL };

  await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_KEY,
      'X-Bin-Versioning': 'false'
    },
    body: JSON.stringify(record)
  });
}

loadFromJSONBin();
