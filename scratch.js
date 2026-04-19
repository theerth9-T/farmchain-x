




        /** NAVIGATION & REAL-TIME LOGIC **/
        let activeBatchId = null;
        let socket = null;
        let qrcode = null;

        function initSocket() {
            if (socket || typeof io === 'undefined') return;
            try {
                socket = io('http://localhost:5000');
                
                socket.on('connect', () => {
                    console.log('Connected to FarmChain Real-Time Engine');
                });

                socket.on('telemetryUpdate', (data) => {
                    console.log('Real-time update received:', data);
                    if (activeBatchId === data.batch) {
                        updateLiveUI(data);
                    }
                });
            } catch (err) {
                console.warn('Socket.io failed to initialize:', err);
            }
        }

        function updateLiveUI(data) {
            // Update sensor cards
            document.querySelector('.fa-droplet').nextElementSibling.nextElementSibling.innerText = `${data.moisture}%`;
            document.querySelector('.fa-temperature-high').nextElementSibling.nextElementSibling.innerText = `${data.temperature}°C`;
            document.querySelector('.fa-vial').nextElementSibling.nextElementSibling.innerText = `${data.nutrients}%`;

            // Update charts
            if (charts.health) {
                // Simplified health update for demo
                const score = (data.moisture > 30 && data.moisture < 60) ? 90 : 45;
                charts.health.data.datasets[0].data = [score, 100-score];
                charts.health.update();
                document.querySelector('#page-farm-details .text-4xl').innerText = `${score}%`;
            }
        }

        async function logout() {
            try {
                await fetch('/api/auth/logout');
                sessionStorage.removeItem('role');
                window.location.href = 'common-login.html';
            } catch (err) {
                console.error('Logout error:', err);
            }
        }

        async function navigateTo(pageId, batchId = null) {
            if (batchId) activeBatchId = batchId;

            // Hide all sub-pages in the portal
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            // Show target
            const target = document.getElementById(pageId);
            if (target) target.classList.add('active');

            // Header Controls
            const backBtn = document.getElementById('back-btn');
            if (pageId === 'page-farmer-dashboard') {
                backBtn.classList.add('hidden');
            } else {
                backBtn.classList.remove('hidden');
            }

            // Specific Page Logic
            if (pageId === 'page-farm-details' && activeBatchId) {
                await loadBatchDetails(activeBatchId);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function goBack() {
            navigateTo('page-farmer-dashboard');
        }

        /** DATA FETCHING **/
        async function fetchBatches() {
            try {
                const response = await fetch('/api/batches');
                const result = await response.json();
                
                if (result.success) {
                    renderBatchList(result.data);
                }
            } catch (err) {
                console.error('Error fetching batches:', err);
            }
        }

        function renderBatchList(batches) {
            const container = document.querySelector('#page-farmer-dashboard .grid');
            if (!container) return;

            if (batches.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed text-gray-400 font-bold">No batches registered yet. Start by registering your first crop!</div>`;
                return;
            }

            container.innerHTML = batches.map(batch => `
                <div class="group relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all text-left flex items-center justify-between">
                    <button onclick="navigateTo('page-farm-details', '${batch._id}')" class="flex-grow p-8 text-left flex items-center justify-between">
                        <div>
                            <div class="font-black text-xl text-gray-800">${batch.cropVariety}</div>
                            <div class="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                                <i class="fa-solid fa-location-dot"></i> ${batch.location}
                            </div>
                            <div class="text-[9px] text-gray-400 font-bold uppercase mt-1">ID: ${batch.batchId} | ${batch.status}</div>
                        </div>
                        <div class="bg-emerald-50 p-4 rounded-full text-emerald-600 group-hover:bg-farm-green group-hover:text-white transition-all">
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </button>
                    <!-- Delete Button -->
                    <button onclick="handleDeleteBatch(event, '${batch._id}')" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-100 text-red-500 hover:bg-red-600 hover:text-white shadow-md transition-all flex items-center justify-center text-xs z-30 opacity-0 group-hover:opacity-100">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `).join('');
        }

        let batchToDeleteId = null;

        function closeDeleteModal() {
            document.getElementById('delete-modal').classList.add('hidden');
            batchToDeleteId = null;
        }

        async function handleDeleteBatch(e, id) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Delete requested for:', id);
            batchToDeleteId = id;
            document.getElementById('delete-modal').classList.remove('hidden');
        }

        async function confirmDelete() {
            if (!batchToDeleteId) return;
            
            try {
                const response = await fetch(`/api/batches/${batchToDeleteId}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Batch successfully purged from the ledger', 'success');
                    closeDeleteModal();
                    fetchBatches();
                } else {
                    showToast(result.error || 'Deletion failed', 'error');
                }
            } catch (err) {
                console.error('Deletion error:', err);
                showToast('Blockchain connection interrupted', 'error');
            }
        }

        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `p-5 rounded-2xl shadow-2xl flex items-center gap-4 text-white font-bold text-xs uppercase tracking-widest animate-in slide-in-from-right duration-300 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
            toast.innerHTML = `
                <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
                <span>${message}</span>
            `;
            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        async function handleRegistration(e) {
            e.preventDefault();
            const form = e.target;
            const data = {
                cropVariety: form.querySelector('input[placeholder="e.g. Arabica Coffee"]').value,
                batchId: form.querySelector('input[placeholder="#BATCH-912"]').value,
                sowingDate: form.querySelector('input[type="date"]').value,
                location: 'Green Valley' // Hardcoded for demo or add field
            };

            try {
                const response = await fetch('/api/batches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    const overlay = document.getElementById('success-overlay');
                    overlay.classList.remove('hidden');
                    showToast('Crop registered on the FarmChain', 'success');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                        fetchBatches();
                        navigateTo('page-farmer-dashboard');
                    }, 2000);
                } else {
                    showToast(result.error || 'Registration failed', 'error');
                }
            } catch (err) {
                console.error('Registration error:', err);
            }
        }

        async function loadBatchDetails(id) {
            try {
                const response = await fetch(`/api/batches/${id}`);
                const result = await response.json();
                
                if (result.success) {
                    const batch = result.data;
                    document.querySelector('#page-farm-details h2').innerText = `${batch.cropVariety} Management`;
                    
                    // Render Timeline
                    renderTimeline(batch.timeline);
                    
                    // Generate QR
                    generateQR(batch._id);

                    // AI Insights
                    if (batch.aiAnalysis) {
                        renderAI(batch.aiAnalysis);
                    }

                    document.getElementById('page-farm-details').setAttribute('data-id', batch._id);
                    initCharts(batch._id);
                    initSocket();
                    if (socket) socket.emit('subscribeToBatch', batch._id);
                }
            } catch (err) {
                console.error('Error loading details:', err);
            }
        }

        function renderTimeline(timeline) {
            const container = document.getElementById('timeline-container');
            const progress = document.getElementById('timeline-progress');
            
            const activeIndex = timeline.findIndex(t => t.active);
            progress.style.width = `${(activeIndex / (timeline.length - 1)) * 100}%`;

            container.innerHTML = `
                <div class="absolute left-8 right-8 h-1 bg-gray-100 top-5 -z-0"></div>
                ${timeline.map((item, idx) => `
                    <div class="relative z-10 flex flex-col items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center border-4 ${item.completed ? 'bg-emerald-500 border-emerald-100 text-white' : 'bg-white border-gray-100 text-gray-300'} transition-all duration-500">
                            <i class="fa-solid ${item.completed ? 'fa-check' : 'fa-circle'} text-[10px]"></i>
                        </div>
                        <span class="text-[9px] font-black uppercase tracking-tighter ${item.active ? 'text-emerald-600' : 'text-gray-400'}">${item.stage}</span>
                    </div>
                `).join('')}
            `;
        }

        function generateQR(id) {
            const container = document.getElementById('qrcode');
            if (!container) return;
            container.innerHTML = "";
            
            if (typeof QRCode !== 'undefined') {
                qrcode = new QRCode(container, {
                    text: `${window.location.origin}/traceability.html?batchId=${id}`,
                    width: 128,
                    height: 128,
                    colorDark : "#1a4d2e",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            } else {
                container.innerHTML = "<div class='text-[8px] font-bold text-gray-300'>QR Code Offline</div>";
            }
            document.getElementById('public-link').href = `/traceability.html?batchId=${id}`;
        }

        function renderAI(ai) {
            document.getElementById('ai-insight-panel').classList.remove('hidden');
            document.getElementById('ai-health-val').innerText = `${ai.score}%`;
            document.getElementById('ai-status-badge').innerText = ai.status;
            document.getElementById('ai-status-badge').className = `px-3 py-1 rounded-full text-[9px] font-black uppercase bg-${ai.color.split('-')[0]}-100 text-${ai.color}`;
            document.getElementById('ai-recommendation').innerText = `"${ai.recommendation}"`;
        }

        /** REAL-TIME LOGIC **/
        let socket;
        function initSocket() {
            if (socket) return;
            socket = io();
            
            socket.on('connect', () => console.log('[Neural Link] Connected to FarmChain X Core'));
            
            socket.on('batch_created', (batch) => {
                showToast(`New Batch Detected: ${batch.cropVariety}`, 'success');
                fetchBatches();
            });

            socket.on('batch_updated', (data) => {
                console.log('[Neural Link] Batch Update Received:', data);
                fetchBatches(); // Soft refresh grid
                
                // If we are looking at this specific batch, refresh details
                const currentBatchId = document.querySelector('#page-farm-details')?.getAttribute('data-id');
                if (currentBatchId === data.id) {
                    loadBatchDetails(data.id);
                    showToast(`Neural Update: ${data.status.toUpperCase()}`, 'success');
                }
            });

            socket.on('batch_deleted', (id) => {
                console.log('[Neural Link] Batch Purged:', id);
                fetchBatches();
                if (document.querySelector('#page-farm-details')?.getAttribute('data-id') === id) {
                    navigateTo('page-farmer-dashboard');
                    showToast('Batch was purged from the ledger', 'error');
                }
            });
        }

        /** CHARTING LOGIC **/
        let charts = {};
        async function initCharts(batchId) {
            Object.values(charts).forEach(c => c.destroy());

            const config = { cutout: '85%', plugins: { legend: { display: false } } };

            // For now use default data or fetch from /api/batches/:id/sensors
            // Distribution
            charts.dist = new Chart(document.getElementById('chartDistribution'), {
                type: 'doughnut',
                data: {
                    labels: ['A', 'B', 'C'],
                    datasets: [{
                        data: [40, 30, 30],
                        backgroundColor: ['#1a4d2e', '#3a7d44', '#86a789'],
                        borderWidth: 5,
                        borderColor: '#ffffff'
                    }]
                },
                options: config
            });

            // Health (Simulated)
            charts.health = new Chart(document.getElementById('chartHealth'), {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [70, 30],
                        backgroundColor: ['#1a4d2e', '#f3f4f6'],
                        borderWidth: 0
                    }]
                },
                options: { 
                    ...config,
                    rotation: -90, 
                    circumference: 180
                }
            });

            // Yield Bar
            charts.yield = new Chart(document.getElementById('chartYield'), {
                type: 'bar',
                data: {
                    labels: ['Aug', 'Sep', 'Oct'],
                    datasets: [{
                        data: [50, 75, 90],
                        backgroundColor: '#1a4d2e',
                        borderRadius: 12
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        y: { display: false },
                        x: { grid: { display: false }, border: { display: false } }
                    }
                }
            });
        }

        /** AUTH PROTECTION **/
        document.addEventListener('DOMContentLoaded', async () => {
            const role = sessionStorage.getItem('role');
            
            // Verify session with server
            try {
                const response = await fetch('/api/auth/me');
                const result = await response.json();
                
                if (result.success && result.data.role === 'farmer') {
                    document.getElementById('section-portal').classList.remove('hidden');
                    initSocket();
                    fetchBatches();
                    navigateTo('page-farmer-dashboard');
                } else {
                    window.location.href = 'common-login.html';
                }
            } catch (err) {
                window.location.href = 'common-login.html';
            }
        });
    