// ReelBerlin Demo - API Integration
const API_BASE_URL = 'https://instagramreelposter-production.up.railway.app';

const form = document.getElementById('reelForm');
const resultSection = document.getElementById('result');
const statusTitle = document.getElementById('statusTitle');
const statusMessage = document.getElementById('statusMessage');
const progressFill = document.getElementById('progressFill');
const videoContainer = document.getElementById('videoContainer');
const resultVideo = document.getElementById('resultVideo');
const downloadLink = document.getElementById('downloadLink');
const submitBtn = document.querySelector('.submit-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const logoDropZone = document.getElementById('logoDropZone');
const logoInput = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');
const logoPosition = document.getElementById('logoPosition');

// Store uploaded files as base64
let uploadedFiles = [];
let logoBase64 = null;

// Status-Nachrichten für jeden Schritt
const STATUS_MESSAGES = {
    pending: { title: '⏳ In Warteschlange', message: 'Ihre Anfrage befindet sich in der Warteschlange...', progress: 5 },
    transcribing: { title: '🎤 Analyse', message: 'Inhalt Ihrer Website wird gelesen...', progress: 10 },
    planning: { title: '🧠 Planung', message: 'Branchenkategorie wird erkannt...', progress: 20 },
    generating_commentary: { title: '✍️ Schreiben', message: 'Promo-Skript wird erstellt...', progress: 30 },
    synthesizing_voiceover: { title: '🗣️ Stimme', message: 'Voiceover wird generiert...', progress: 45 },
    selecting_music: { title: '🎵 Musik', message: 'Hintergrundmusik wird ausgewählt...', progress: 55 },
    generating_images: { title: '🎨 Visuals', message: 'Bilder werden erstellt...', progress: 70 },
    generating_subtitles: { title: '📝 Untertitel', message: 'Untertitel werden hinzugefügt...', progress: 80 },
    building_manifest: { title: '📦 Erstellung', message: 'Video wird vorbereitet...', progress: 85 },
    rendering: { title: '🎬 Rendering', message: 'Finales Video wird gerendert...', progress: 95 },
    completed: { title: '✅ Fertig', message: 'Ihr Reel ist bereit!', progress: 100 },
    failed: { title: '❌ Fehlgeschlagen', message: 'Etwas ist schief gelaufen.', progress: 0 },
};

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const websiteUrl = document.getElementById('websiteUrl').value;
    const businessName = document.getElementById('businessName').value;
    const category = document.getElementById('category').value;
    const language = document.getElementById('language').value;
    const consent = document.getElementById('consent').checked;

    if (!consent) {
        alert('Please confirm you have permission to create content from this website.');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    resultSection.classList.remove('hidden');
    videoContainer.classList.add('hidden');

    try {
        // Get uploaded media as base64 array
        const media = getMediaPayload();

        // Submit job to API
        const response = await fetch(`${API_BASE_URL}/api/website`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                website: websiteUrl,
                businessName: businessName || undefined,
                category: category || undefined,
                consent: true,
                language: language,
                media: media.length > 0 ? media : undefined,
                logoUrl: logoBase64 || undefined,
                logoPosition: logoBase64 ? logoPosition.value : undefined,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to start job');
        }

        const { jobId } = await response.json();
        console.log('Job started:', jobId);

        // Poll for status
        await pollJobStatus(jobId);

    } catch (error) {
        console.error('Error:', error);
        updateStatus('failed', error.message);
    } finally {
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
});

// Poll job status until complete
async function pollJobStatus(jobId) {
    const pollInterval = 3000; // 3 seconds
    const maxAttempts = 120; // 6 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
            const job = await response.json();

            updateStatus(job.status, job.statusMessage);

            if (job.status === 'completed') {
                showVideo(job.finalVideoUrl);
                return;
            }

            if (job.status === 'failed') {
                throw new Error(job.error || 'Job failed');
            }

            await sleep(pollInterval);
            attempts++;

        } catch (error) {
            console.error('Poll error:', error);
            throw error;
        }
    }

    throw new Error('Job timed out after 6 minutes');
}

// Update status display
function updateStatus(status, message) {
    const statusInfo = STATUS_MESSAGES[status] || {
        title: '⏳ Processing',
        message: message || 'Working on your reel...',
        progress: 50
    };

    statusTitle.textContent = statusInfo.title;
    statusMessage.textContent = message || statusInfo.message;
    progressFill.style.width = `${statusInfo.progress}%`;
}

// Show completed video
function showVideo(videoUrl) {
    videoContainer.classList.remove('hidden');
    resultVideo.src = videoUrl;
    downloadLink.href = videoUrl;
}

// Demo site buttons
document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const demoPath = btn.dataset.url;
        const fullUrl = window.location.origin + demoPath;
        document.getElementById('websiteUrl').value = fullUrl;
    });
});

// Utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check API connectivity on load
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
        if (response.ok) {
            console.log('✅ API connected');
        }
    } catch (error) {
        console.warn('⚠️ API not reachable. Update API_BASE_URL in app.js');
    }
}

checkApiHealth();

// ===== FILE UPLOAD HANDLING =====

// Drag and drop events
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Handle file selection
function handleFiles(files) {
    const maxFiles = 5;
    const remainingSlots = maxFiles - uploadedFiles.length;

    if (remainingSlots <= 0) {
        alert('Maximal 5 Bilder erlaubt.');
        return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
        if (!file.type.startsWith('image/')) {
            console.warn('Skipping non-image file:', file.name);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            uploadedFiles.push({
                name: file.name,
                base64: base64,
            });
            renderPreviews();
        };
        reader.readAsDataURL(file);
    });
}

// Render image previews
function renderPreviews() {
    previewContainer.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${file.base64}" alt="${file.name}">
            <button type="button" class="preview-remove" data-index="${index}">×</button>
        `;
        previewContainer.appendChild(item);
    });

    // Add remove handlers
    document.querySelectorAll('.preview-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            uploadedFiles.splice(index, 1);
            renderPreviews();
        });
    });
}

// Convert uploadedFiles to media array for API
function getMediaPayload() {
    return uploadedFiles.map(f => f.base64);
}

// Logo upload handling
logoDropZone.addEventListener('click', () => logoInput.click());
logoDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoDropZone.classList.add('dragover');
});
logoDropZone.addEventListener('dragleave', () => {
    logoDropZone.classList.remove('dragover');
});
logoDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    logoDropZone.classList.remove('dragover');
    handleLogo(e.dataTransfer.files[0]);
});
logoInput.addEventListener('change', (e) => {
    handleLogo(e.target.files[0]);
});

function handleLogo(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        logoBase64 = e.target.result;
        logoPreview.style.backgroundImage = `url(${logoBase64})`;
        logoPreview.classList.remove('hidden');
        logoDropZone.querySelector('.drop-icon').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}
