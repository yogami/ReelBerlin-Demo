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

// Status messages for each step
const STATUS_MESSAGES = {
    pending: { title: '⏳ Queued', message: 'Your request is in the queue...', progress: 5 },
    transcribing: { title: '🎤 Analyzing', message: 'Reading your website content...', progress: 10 },
    planning: { title: '🧠 Planning', message: 'Detecting business category...', progress: 20 },
    generating_commentary: { title: '✍️ Writing', message: 'Creating promotional script...', progress: 30 },
    synthesizing_voiceover: { title: '🗣️ Voice', message: 'Generating voiceover...', progress: 45 },
    selecting_music: { title: '🎵 Music', message: 'Selecting background music...', progress: 55 },
    generating_images: { title: '🎨 Visuals', message: 'Creating images...', progress: 70 },
    generating_subtitles: { title: '📝 Subtitles', message: 'Adding captions...', progress: 80 },
    building_manifest: { title: '📦 Building', message: 'Preparing video...', progress: 85 },
    rendering: { title: '🎬 Rendering', message: 'Rendering final video...', progress: 95 },
    completed: { title: '✅ Complete', message: 'Your reel is ready!', progress: 100 },
    failed: { title: '❌ Failed', message: 'Something went wrong.', progress: 0 },
};

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const websiteUrl = document.getElementById('websiteUrl').value;
    const businessName = document.getElementById('businessName').value;
    const category = document.getElementById('category').value;
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
        // Submit job to API
        const response = await fetch(`${API_BASE_URL}/api/reels/website`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                website: websiteUrl,
                businessName: businessName || undefined,
                category: category || undefined,
                consent: true,
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
            const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
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
