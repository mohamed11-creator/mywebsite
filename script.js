const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dsaxcy1sm/auto/upload";
const CLOUDINARY_UPLOAD_PRESET = "business"; // your unsigned preset
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/YOUR_BIN_ID";
const JSONBIN_KEY = "YOUR_JSONBIN_API_KEY";

const main = document.getElementById("main");
const splash = document.getElementById("splash");
const slotsContainer = document.querySelector(".slots-container");

let slotsData = [];

// Generate 24 slots dynamically
for(let i=0;i<24;i++){
    const slot = document.createElement("div");
    slot.className = "slot";

    const img = document.createElement("img");
    img.src = ""; // default empty
    img.alt = `Slot ${i+1}`;
    slot.appendChild(img);

    const linkInput = document.createElement("input");
    linkInput.type = "text";
    linkInput.placeholder = "Add link here";
    slot.appendChild(linkInput);

    const uploadBtn = document.createElement("button");
    uploadBtn.textContent = "Upload Image";
    slot.appendChild(uploadBtn);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove Image";
    removeBtn.className = "remove";
    slot.appendChild(removeBtn);

    slotsContainer.appendChild(slot);

    // Store slot data
    slotsData.push({img, linkInput});
}

// Splash fade out
setTimeout(() => {
    splash.style.display = "none";
    main.classList.remove("hidden");
    loadFromJSONBin();
}, 4000);

// Functions
async function loadFromJSONBin(){
    try {
        const res = await axios.get(JSONBIN_URL, {
            headers: { "X-Master-Key": JSONBIN_KEY }
        });
        const data = res.data.record;
        data.forEach((item, idx) => {
            if(slotsData[idx]){
                slotsData[idx].img.src = item.img || "";
                slotsData[idx].linkInput.value = item.link || "";
            }
        });
    } catch(e){console.log(e);}
}

async function saveToJSONBin(){
    const data = slotsData.map(s => ({img: s.img.src, link: s.linkInput.value}));
    try {
        await axios.put(JSONBIN_URL, { record: data }, {
            headers: {
                "X-Master-Key": JSONBIN_KEY,
                "Content-Type": "application/json"
            }
        });
    } catch(e){console.log(e);}
}

// Event listeners
slotsData.forEach((slot, idx)=>{
    slot.img.parentElement.querySelector("button").addEventListener("click", async ()=>{
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = async ()=>{
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            try {
                const res = await axios.post(CLOUDINARY_URL, formData);
                slot.img.src = res.data.secure_url;
                saveToJSONBin();
            } catch(e){console.log(e);}
        }
        fileInput.click();
    });

    // Remove button
    slot.img.parentElement.querySelector(".remove").addEventListener("click", ()=>{
        slot.img.src = "";
        slot.linkInput.value = "";
        saveToJSONBin();
    });

    // Save link on change
    slot.linkInput.addEventListener("change", ()=>saveToJSONBin());
});
