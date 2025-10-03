/* CONFIG - do not change keys here unless you know what you do */
const CLOUD_NAME = 'dsaxcy1sm';
const UPLOAD_PRESET = 'business';
const JSONBIN_ID = '68df382743b1c97be95889d1';
const JSONBIN_KEY = '$2a$10$qWk39lnjY9SiWVhoQfD46eRhr0RfoeCog/5LazFm7xRkWsdHTIxSW';
const SLOTS = 24;

/* UI elements */
const splash = document.getElementById('splash');
const main = document.getElementById('main');
const gallery = document.getElementById('gallery');

/* Utility: create default record (array of objects) */
function makeEmptyRecord(){
  const arr = [];
  for(let i=0;i<SLOTS;i++) arr.push({ img:'', link:'' });
  return arr;
}

/* JSONBin helpers */
async function fetchRecord(){
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    if (!res.ok) {
      // if bin not accessible, return empty
      console.warn('JSONBin GET not ok', res.status);
      return makeEmptyRecord();
    }
    const json = await res.json();
    // json.record could be an array or an object. We expect array.
    const record = json.record;
    if (!Array.isArray(record)) return makeEmptyRecord();
    // ensure length SLOTS
    if (record.length < SLOTS) {
      const missing = SLOTS - record.length;
      for(let i=0;i<missing;i++) record.push({img:'',link:''});
    }
    return record.slice(0,SLOTS);
  } catch (err) {
    console.error('fetchRecord error', err);
    return makeEmptyRecord();
  }
}

async function saveRecord(record){
  // record expected to be array of SLOTS objects
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
      },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error('JSONBin save failed: ' + res.status + ' ' + text);
    }
    return true;
  } catch (err) {
    console.error('saveRecord error', err);
    alert('Error saving data: ' + err.message);
    return false;
  }
}

/* Cloudinary upload */
async function uploadToCloudinary(file){
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  try {
    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Cloudinary upload failed: ' + res.status);
    const json = await res.json();
    return json.secure_url || null;
  } catch (err) {
    console.error('uploadToCloudinary', err);
    alert('Upload failed: ' + (err.message || 'unknown'));
    return null;
  }
}

/* Create slot DOM element */
function createSlot(index, item, recordRef){
  const slot = document.createElement('div');
  slot.className = 'slot';
  slot.dataset.index = index;

  // frame + image
  const frame = document.createElement('div');
  frame.className = 'frame';
  const img = document.createElement('img');
  img.alt = `Slot ${index+1}`;
  if (item.img) img.src = item.img;
  frame.appendChild(img);
  slot.appendChild(frame);

  // view link (button-like)
  const view = document.createElement('a');
  view.className = 'view-link';
  view.textContent = item.link ? 'Open link' : 'No link';
  view.href = item.link || '#';
  view.target = '_blank';
  view.rel = 'noopener noreferrer';
  if (!item.link) view.style.opacity = '0.6';
  slot.appendChild(view);

  // controls container
  const controls = document.createElement('div');
  controls.className = 'controls';

  // link input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter URL';
  input.value = item.link || '';
  controls.appendChild(input);

  // save link button
  const btnSaveLink = document.createElement('button');
  btnSaveLink.className = 'btn';
  btnSaveLink.textContent = 'Save Link';
  btnSaveLink.onclick = async () => {
    recordRef[index] = recordRef[index] || {img:'',link:''};
    recordRef[index].link = input.value.trim();
    view.textContent = recordRef[index].link ? 'Open link' : 'No link';
    view.href = recordRef[index].link || '#';
    const ok = await saveRecord(recordRef);
    if (ok) {
      // subtle feedback
      btnSaveLink.textContent = 'Saved ✓';
      setTimeout(()=> btnSaveLink.textContent = 'Save Link',1000);
    }
  };
  controls.appendChild(btnSaveLink);

  // upload button
  const btnUpload = document.createElement('button');
  btnUpload.className = 'btn';
  btnUpload.textContent = 'Upload Image';
  btnUpload.onclick = async () => {
    const fi = document.createElement('input');
    fi.type = 'file';
    fi.accept = 'image/*';
    fi.onchange = async () => {
      const file = fi.files[0];
      if (!file) return;
      btnUpload.disabled = true;
      btnUpload.textContent = 'Uploading...';
      const url = await uploadToCloudinary(file);
      btnUpload.disabled = false;
      btnUpload.textContent = 'Upload Image';
      if (url) {
        recordRef[index] = recordRef[index] || {img:'',link:''};
        recordRef[index].img = url;
        img.src = url;
        const ok = await saveRecord(recordRef);
        if (ok) {
          btnUpload.textContent = 'Uploaded ✓';
          setTimeout(()=> btnUpload.textContent = 'Upload Image',1200);
        }
      }
    };
    fi.click();
  };
  controls.appendChild(btnUpload);

  // remove
  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn danger';
  btnRemove.textContent = 'Remove';
  btnRemove.onclick = async () => {
    if (!confirm('Remove image and link from this slot?')) return;
    recordRef[index] = {img:'',link:''};
    img.src = '';
    input.value = '';
    view.textContent = 'No link';
    view.href = '#';
    const ok = await saveRecord(recordRef);
    if (ok) alert('Slot cleared.');
  };
  controls.appendChild(btnRemove);

  slot.appendChild(controls);

  return slot;
}

/* Render gallery from record */
function renderGallery(record){
  gallery.innerHTML = '';
  for(let i=0;i<SLOTS;i++){
    const item = record[i] || {img:'',link:''};
    const slotEl = createSlot(i, item, record);
    gallery.appendChild(slotEl);
  }
}

/* Load + render flow */
async function loadAndShow(){
  const record = await fetchRecord();
  renderGallery(record);
}

/* Splash handling: show once then gallery */
window.addEventListener('load', async ()=>{
  // show splash (fade in)
  requestAnimationFrame(()=> splash.style.opacity = '1');
  // visible for 4s, then fade out and show
  setTimeout(()=> {
    splash.style.opacity = '0';
    setTimeout(()=>{
      splash.style.display = 'none';
      main.style.display = 'block';
      main.setAttribute('aria-hidden','false');
      loadAndShow();
    }, 1000);
  }, 4000);
});
