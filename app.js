/**
 * 틈타 (Teumta) - Core Application Logic
 */

// --- 1. Data Store / State Management (Local Storage wrapper) ---
const STORAGE_KEY = 'sukima_baito_mvp_data';

let state = {
    gigs: [],
    seekerSchedule: {
        startTime: '11:00',
        endTime: '15:00',
        location: '강남구 역삼동',
        jobType: 'all'
    },
    seekerReservation: null,
    seekerEarnings: 0
};

// Initial Sample Data (To populate the app on first load)
const sampleGigs = [
    {
        id: 'gig-1',
        title: '카페 홀 서빙',
        employer: '역삼 스타카페',
        pay: 12000,
        startTime: '11:00',
        endTime: '14:00',
        location: '강남구 역삼동',
        description: '점심 피크 타임 음료 서빙 및 테이블 정리 간단한 보조 업무입니다. 활기차고 밝은 분 환영!',
        status: 'waiting',
        workerName: null,
        workerRating: null
    },
    {
        id: 'gig-2',
        title: '레스토랑 식기세척',
        employer: '도산 파스타키친',
        pay: 13000,
        startTime: '12:00',
        endTime: '15:00',
        location: '서초구 서초동',
        description: '바쁜 점심 시간대 식기 세척 및 주방 보조 업무입니다. 고무장갑 제공, 간단한 식사 제공합니다.',
        status: 'waiting',
        workerName: null,
        workerRating: null
    },
    {
        id: 'gig-3',
        title: '편의점 물류 분류',
        employer: 'GS25 역삼벤처점',
        pay: 11000,
        startTime: '13:00',
        endTime: '15:00',
        location: '강남구 역삼동',
        description: '오후 물류 입고 차량 하차 보조 및 음료 냉장고 진열 업무입니다. 단순 반복 작업입니다.',
        status: 'waiting',
        workerName: null,
        workerRating: null
    }
];

function loadState() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
        try {
            state = JSON.parse(rawData);
        } catch (e) {
            console.error('Failed to parse localStorage data', e);
            resetToDefault();
        }
    } else {
        resetToDefault();
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetToDefault() {
    state.gigs = [...sampleGigs];
    state.seekerSchedule = {
        startTime: '11:00',
        endTime: '15:00',
        location: '강남구 역삼동',
        jobType: 'all'
    };
    state.seekerReservation = null;
    state.seekerEarnings = 0;
    saveState();
}

// --- 2. Toast Alert Helper ---
function showToast(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '<i class="fa-solid fa-bell"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    else if (type === 'employer') icon = '<i class="fa-solid fa-briefcase"></i>';

    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

// --- 3. View Switch Logic ---
function initViewSwitcher() {
    const btnSeeker = document.getElementById('btn-seeker');
    const btnEmployer = document.getElementById('btn-employer');
    const viewSeeker = document.getElementById('seeker-view');
    const viewEmployer = document.getElementById('employer-view');

    btnSeeker.addEventListener('click', () => {
        btnSeeker.classList.add('active');
        btnEmployer.classList.remove('active');
        viewSeeker.classList.add('active');
        viewEmployer.classList.remove('active');
        document.body.classList.remove('employer-theme-active');
        renderSeekerView();
    });

    btnEmployer.addEventListener('click', () => {
        btnEmployer.classList.add('active');
        btnSeeker.classList.remove('active');
        viewEmployer.classList.add('active');
        viewSeeker.classList.remove('active');
        document.body.classList.add('employer-theme-active');
        renderEmployerView();
    });
}

// --- 4. AI Matching Hero Stage Machine (idle / searching / result) ---
function setHeroStage(mode, stage) {
    const idle = document.getElementById(`${mode}-hero-idle`);
    const searching = document.getElementById(`${mode}-hero-searching`);
    const result = document.getElementById(`${mode}-hero-result`);

    [idle, searching, result].forEach(el => el.classList.remove('active'));
    if (stage === 'idle') idle.classList.add('active');
    if (stage === 'searching') searching.classList.add('active');
    if (stage === 'result') result.classList.add('active');
}

window.resetSeekerHero = function() {
    setHeroStage('seeker', 'idle');
};

window.resetEmployerHero = function() {
    setHeroStage('employer', 'idle');
};

function renderSeekerHeroResult() {
    const panel = document.getElementById('seeker-hero-result');

    if (state.seekerReservation) {
        const r = state.seekerReservation;
        panel.innerHTML = `
            <div class="result-card">
                <span class="result-badge pending"><i class="fa-solid fa-hourglass-half"></i> 예약 대기 중</span>
                <div class="result-headline">지금은 딱 맞는 자리가 없어요</div>
                <p class="result-sub">조건에 맞는 긴급 구인이 새로 등록되면 AI가 즉시 자동으로 매칭해드려요.</p>
                <div class="result-job-card pending-card">
                    <div class="detail-item"><i class="fa-solid fa-briefcase"></i> ${r.jobType === 'all' ? '전체 업종' : r.jobType}</div>
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${r.startTime} ~ ${r.endTime}</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${r.location}</div>
                </div>
                <div class="result-actions">
                    <button class="btn-hero-secondary" onclick="handleCancelReservation()"><i class="fa-solid fa-xmark"></i> 예약 취소</button>
                    <button class="btn-hero-primary" onclick="resetSeekerHero()"><i class="fa-solid fa-rotate"></i> 조건 다시 설정</button>
                </div>
            </div>
        `;
        setHeroStage('seeker', 'result');
        return;
    }

    const lastMatched = [...state.gigs].reverse().find(g => g.workerName === '홍길동' && g.status === 'matched');
    if (!lastMatched) {
        setHeroStage('seeker', 'idle');
        return;
    }

    panel.innerHTML = `
        <div class="result-card">
            <span class="result-badge success"><i class="fa-solid fa-circle-check"></i> 매칭 성공</span>
            <div class="result-headline">${lastMatched.title} 매칭 완료!</div>
            <p class="result-sub">면접 없이 즉시 확정되었어요. 근무 시간에 맞춰 출근 체크만 하면 끝!</p>
            <div class="result-job-card">
                <div class="job-header">
                    <div class="job-badge-area">
                        <span class="job-title">${lastMatched.title}</span>
                        <span class="job-employer">${lastMatched.employer}</span>
                    </div>
                    <div class="pay-badge"><i class="fa-solid fa-coins"></i> 시급 ${lastMatched.pay.toLocaleString()}원</div>
                </div>
                <div class="detail-item"><i class="fa-solid fa-clock"></i> ${lastMatched.startTime} ~ ${lastMatched.endTime}</div>
                <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${lastMatched.location}</div>
            </div>
            <div class="result-actions">
                <button class="btn-hero-primary" onclick="resetSeekerHero()"><i class="fa-solid fa-bolt"></i> 다른 조건으로 다시 매칭</button>
            </div>
        </div>
    `;
    setHeroStage('seeker', 'result');
}

function renderEmployerHeroResult(gigId) {
    const panel = document.getElementById('employer-hero-result');
    const gig = state.gigs.find(g => g.id === gigId);
    if (!gig) {
        setHeroStage('employer', 'idle');
        return;
    }

    if (gig.status === 'matched') {
        panel.innerHTML = `
            <div class="result-card">
                <span class="result-badge success"><i class="fa-solid fa-circle-check"></i> 매칭 성공</span>
                <div class="result-headline">${gig.workerName}님이 매칭되었어요!</div>
                <p class="result-sub">면접 없이 실시간으로 확정됐어요. 근무 상태를 실시간으로 확인해보세요.</p>
                <div class="result-job-card">
                    <div class="worker-profile-mini">
                        <div class="worker-info-mini">
                            <span class="worker-name-mini">${gig.workerName}</span>
                            <span class="worker-rating"><i class="fa-solid fa-star"></i> ${gig.workerRating}</span>
                        </div>
                        <span class="detail-item">${gig.title}</span>
                    </div>
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${gig.startTime} ~ ${gig.endTime}</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                </div>
                <div class="result-actions">
                    <button class="btn-hero-primary employer-cta" onclick="resetEmployerHero()"><i class="fa-solid fa-plus"></i> 새 구인 등록하기</button>
                </div>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <div class="result-card">
                <span class="result-badge pending"><i class="fa-solid fa-hourglass-half"></i> 매칭 대기 중</span>
                <div class="result-headline">등록 완료! 인재를 찾고 있어요</div>
                <p class="result-sub">조건에 맞는 구직자가 실시간 매칭을 시도하면 즉시 알려드릴게요.</p>
                <div class="result-job-card pending-card">
                    <div class="job-header">
                        <div class="job-badge-area">
                            <span class="job-title">${gig.title}</span>
                        </div>
                        <div class="pay-badge"><i class="fa-solid fa-coins"></i> 시급 ${gig.pay.toLocaleString()}원</div>
                    </div>
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${gig.startTime} ~ ${gig.endTime}</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                </div>
                <div class="result-actions">
                    <button class="btn-hero-primary employer-cta" onclick="resetEmployerHero()"><i class="fa-solid fa-plus"></i> 새 구인 등록하기</button>
                </div>
            </div>
        `;
    }
    setHeroStage('employer', 'result');
}

// --- 5. Time / Job-type Matching Helpers ---
// Formats: "09:00", "13:00" etc.
function isTimeWithin(seekerStart, seekerEnd, gigStart, gigEnd) {
    const [sStartH, sStartM] = seekerStart.split(':').map(Number);
    const [sEndH, sEndM] = seekerEnd.split(':').map(Number);
    const [gStartH, gStartM] = gigStart.split(':').map(Number);
    const [gEndH, gEndM] = gigEnd.split(':').map(Number);

    const sStart = sStartH * 60 + sStartM;
    const sEnd = sEndH * 60 + sEndM;
    const gStart = gStartH * 60 + gStartM;
    const gEnd = gEndH * 60 + gEndM;

    // Seeker can work if Seeker's available window covers the whole Gig window
    return (sStart <= gStart) && (sEnd >= gEnd);
}

function isJobTypeMatch(jobType, gigTitle) {
    return jobType === 'all' || jobType === gigTitle;
}

// Find gigs that satisfy a seeker condition (time / location / job type), status must be 'waiting'
function findMatchingGigs(condition) {
    return state.gigs.filter(gig => {
        if (gig.status !== 'waiting') return false;
        const isTimeMatch = isTimeWithin(condition.startTime, condition.endTime, gig.startTime, gig.endTime);
        const isLocationMatch = (gig.location === condition.location);
        const isJobMatch = isJobTypeMatch(condition.jobType, gig.title);
        return isTimeMatch && isLocationMatch && isJobMatch;
    });
}

// --- 6. Render Seeker View ---
function renderSeekerView() {
    // 1. Update Profile Dashboard
    document.getElementById('seeker-earnings').textContent = state.seekerEarnings.toLocaleString();

    // Set form defaults
    document.getElementById('seeker-start-time').value = state.seekerSchedule.startTime;
    document.getElementById('seeker-end-time').value = state.seekerSchedule.endTime;
    document.getElementById('seeker-location').value = state.seekerSchedule.location;
    document.getElementById('seeker-job-type').value = state.seekerSchedule.jobType;

    // 2. Render My Active & Finished Gigs (+ pending reservation, if any)
    const activeList = document.getElementById('seeker-active-list');
    const myGigs = state.gigs.filter(g => g.workerName === '홍길동');

    let reservationHtml = '';
    if (state.seekerReservation) {
        const r = state.seekerReservation;
        reservationHtml = `
            <div class="job-card reservation-card">
                <div class="job-header">
                    <div class="job-badge-area">
                        <span class="job-title"><i class="fa-solid fa-hourglass-half"></i> 예약 대기 중</span>
                        <span class="job-employer">${r.jobType === 'all' ? '전체 업종' : r.jobType} · ${r.location}</span>
                    </div>
                    <span class="status-tag status-waiting"><i class="fa-solid fa-clock-rotate-left"></i> 자동 매칭 대기</span>
                </div>
                <div class="job-details">
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${r.startTime} ~ ${r.endTime}</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${r.location}</div>
                </div>
                <p class="job-desc">지금은 조건에 맞는 일자리가 없어요. 조건에 맞는 긴급 구인이 새로 등록되면 즉시 자동으로 매칭해드립니다.</p>
                <div class="job-footer">
                    <button class="btn-secondary" onclick="handleCancelReservation()"><i class="fa-solid fa-xmark"></i> 예약 취소</button>
                </div>
            </div>
        `;
    }

    if (myGigs.length === 0 && !reservationHtml) {
        activeList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-minus"></i>
                <p>현재 매칭되었거나 근무 완료한 일정이 없습니다.</p>
            </div>
        `;
    } else {
        activeList.innerHTML = reservationHtml + myGigs.map(gig => {
            let statusLabel = '';
            let actionBtn = '';

            if (gig.status === 'matched') {
                statusLabel = `<span class="status-tag status-matched"><i class="fa-solid fa-handshake"></i> 매칭완료</span>`;
                actionBtn = `<button class="btn-action-green" onclick="handleStartWork('${gig.id}')"><i class="fa-solid fa-play"></i> 출근 체크</button>`;
            } else if (gig.status === 'working') {
                statusLabel = `<span class="status-tag status-working"><i class="fa-solid fa-person-digging"></i> 근무중</span>`;
                actionBtn = `<button class="btn-action-green" onclick="handleEndWork('${gig.id}')"><i class="fa-solid fa-stop"></i> 퇴근 체크</button>`;
            } else if (gig.status === 'done') {
                statusLabel = `<span class="status-tag status-done"><i class="fa-solid fa-circle-check"></i> 정산완료 (+${(gig.pay * calculateHours(gig.startTime, gig.endTime)).toLocaleString()}원)</span>`;
                actionBtn = `<span class="detail-item" style="color: #067A55; font-weight: 600; font-size:12px; margin-left:auto;"><i class="fa-solid fa-wallet"></i> 계좌 입금 완료</span>`;
            }

            return `
                <div class="job-card">
                    <div class="job-header">
                        <div class="job-badge-area">
                            <span class="job-title">${gig.title}</span>
                            <span class="job-employer">${gig.employer}</span>
                        </div>
                        <div class="pay-badge">
                            <i class="fa-solid fa-coins"></i> 시급 ${gig.pay.toLocaleString()}원
                        </div>
                    </div>
                    <div class="job-details">
                        <div class="detail-item"><i class="fa-solid fa-clock"></i> ${gig.startTime} ~ ${gig.endTime} (${calculateHours(gig.startTime, gig.endTime)}시간)</div>
                        <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                    </div>
                    <div class="job-footer" style="align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top:10px;">
                        ${statusLabel}
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. Render Recommended Gigs (Match engine simulation)
    const recommendedList = document.getElementById('seeker-job-list');

    // Filter conditions: status = 'waiting' and (time overlaps) and (location matches) and (job type matches)
    const filteredGigs = findMatchingGigs(state.seekerSchedule);

    if (filteredGigs.length === 0) {
        recommendedList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass-chart"></i>
                <p>일치하는 틈새 알바가 없습니다.<br>가능 스케줄 또는 선호 지역을 늘려보세요!</p>
            </div>
        `;
    } else {
        recommendedList.innerHTML = filteredGigs.map(gig => `
            <div class="job-card">
                <div class="job-header">
                    <div class="job-badge-area">
                        <span class="job-title">${gig.title}</span>
                        <span class="job-employer">${gig.employer}</span>
                    </div>
                    <div class="pay-badge">
                        <i class="fa-solid fa-coins"></i> 시급 ${gig.pay.toLocaleString()}원
                    </div>
                </div>
                <div class="job-details">
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${gig.startTime} ~ ${gig.endTime} (${calculateHours(gig.startTime, gig.endTime)}시간)</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                </div>
                <p class="job-desc">${gig.description}</p>
                <div class="job-footer">
                    <button class="btn-quick-apply" onclick="handleQuickApply('${gig.id}')">
                        <i class="fa-solid fa-bolt"></i> 1초만에 바로 매칭 (면접없음)
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// --- 7. Render Employer View ---
function renderEmployerView() {
    // Stats calculation
    const myPosted = state.gigs.length;
    const myMatched = state.gigs.filter(g => g.status !== 'waiting').length;

    document.getElementById('employer-active-gigs').textContent = myPosted;
    document.getElementById('employer-matched-gigs').textContent = myMatched;

    // Render Gig List
    const gigList = document.getElementById('employer-gig-list');

    if (state.gigs.length === 0) {
        gigList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>아직 등록하신 구인 공고가 없습니다.<br>위 폼을 이용해 첫 긴급 구인을 시작해 보세요!</p>
            </div>
        `;
    } else {
        // Reverse array to show newest first
        gigList.innerHTML = [...state.gigs].reverse().map(gig => {
            let statusBadge = '';
            let workerPanel = '';

            if (gig.status === 'waiting') {
                statusBadge = `<span class="status-tag status-waiting"><i class="fa-solid fa-spinner"></i> 매칭 대기 중</span>`;
                workerPanel = `<div class="worker-profile-mini"><span style="color:var(--text-muted)">매칭된 인원 없음</span></div>`;
            } else if (gig.status === 'matched') {
                statusBadge = `<span class="status-tag status-matched"><i class="fa-solid fa-handshake"></i> 매칭 완료</span>`;
                workerPanel = `
                    <div class="worker-profile-mini">
                        <div class="worker-info-mini">
                            <span class="worker-name-mini">${gig.workerName}</span>
                            <span class="worker-rating"><i class="fa-solid fa-star"></i> 4.9</span>
                        </div>
                        <span class="detail-item" style="color:var(--accent-gold-deep)">출근 대기</span>
                    </div>
                `;
            } else if (gig.status === 'working') {
                statusBadge = `<span class="status-tag status-working"><i class="fa-solid fa-person-digging"></i> 현재 근무 중</span>`;
                workerPanel = `
                    <div class="worker-profile-mini">
                        <div class="worker-info-mini">
                            <span class="worker-name-mini">${gig.workerName}</span>
                        </div>
                        <span class="detail-item" style="color:#7C3AED"><i class="fa-solid fa-spinner fa-spin"></i> 열일 중</span>
                    </div>
                `;
            } else if (gig.status === 'done') {
                statusBadge = `<span class="status-tag status-done"><i class="fa-solid fa-circle-check"></i> 근무 완료</span>`;
                workerPanel = `
                    <div class="worker-profile-mini">
                        <div class="worker-info-mini">
                            <span class="worker-name-mini">${gig.workerName}</span>
                        </div>
                        <button class="btn-action-green" style="flex:none; padding: 4px 10px; font-size:11px;" onclick="handleApprovePayment('${gig.id}')">
                            급여 지급 승인
                        </button>
                    </div>
                `;
            }

            return `
                <div class="job-card">
                    <div class="job-header">
                        <div class="job-badge-area">
                            <span class="job-title">${gig.title}</span>
                            <span class="job-employer">시급 ${gig.pay.toLocaleString()}원</span>
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="job-details">
                        <div class="detail-item"><i class="fa-solid fa-clock"></i> ${gig.startTime} ~ ${gig.endTime} (${calculateHours(gig.startTime, gig.endTime)}시간)</div>
                        <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                    </div>
                    ${workerPanel}
                </div>
            `;
        }).join('');
    }
}

// --- 8. Business Action Handlers ---

// AI Real-time Matching (Seeker): instantly match if possible, otherwise auto-reserve
document.getElementById('btn-realtime-match').addEventListener('click', () => {
    const startTime = document.getElementById('seeker-start-time').value;
    const endTime = document.getElementById('seeker-end-time').value;
    const location = document.getElementById('seeker-location').value;
    const jobType = document.getElementById('seeker-job-type').value;

    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    if (startH >= endH) {
        showToast('종료 시간은 시작 시간보다 늦어야 합니다.', 'toast');
        return;
    }

    const condition = { startTime, endTime, location, jobType };
    state.seekerSchedule = condition;
    saveState();

    setHeroStage('seeker', 'searching');

    setTimeout(() => {
        const candidates = findMatchingGigs(condition);

        if (candidates.length > 0) {
            // Pick the best-paying match among candidates for instant matching
            candidates.sort((a, b) => b.pay - a.pay);
            const bestGig = candidates[0];
            const gigIndex = state.gigs.findIndex(g => g.id === bestGig.id);

            state.gigs[gigIndex].status = 'matched';
            state.gigs[gigIndex].workerName = '홍길동';
            state.gigs[gigIndex].workerRating = 4.9;
            state.seekerReservation = null;

            saveState();
            showToast(`⚡ 실시간 매칭 성공! '${bestGig.title}' (${bestGig.employer}) 근무가 면접 없이 즉시 확정되었습니다.`, 'success');
        } else {
            state.seekerReservation = { ...condition, createdAt: Date.now() };
            saveState();
            showToast('지금 당장 매칭 가능한 일자리가 없어 예약을 걸어두었습니다. 조건에 맞는 알바가 등록되면 자동으로 매칭해드릴게요!', 'info');
        }

        renderSeekerHeroResult();
        renderSeekerView();
    }, 1400);
});

// Cancel Pending Reservation (Seeker)
window.handleCancelReservation = function() {
    state.seekerReservation = null;
    saveState();
    showToast('예약이 취소되었습니다.', 'info');
    setHeroStage('seeker', 'idle');
    renderSeekerView();
};

// Quick Apply (Seeker, manual pick from the open list)
window.handleQuickApply = function(gigId) {
    const gigIndex = state.gigs.findIndex(g => g.id === gigId);
    if (gigIndex !== -1) {
        state.gigs[gigIndex].status = 'matched';
        state.gigs[gigIndex].workerName = '홍길동';
        state.gigs[gigIndex].workerRating = 4.9;

        saveState();
        showToast('축하합니다! 틈새 알바가 즉시 매칭되었습니다. 면접 없이 확정되었습니다.', 'success');
        renderSeekerView();
    }
};

// Start Work (Seeker Checks-in)
window.handleStartWork = function(gigId) {
    const gigIndex = state.gigs.findIndex(g => g.id === gigId);
    if (gigIndex !== -1) {
        state.gigs[gigIndex].status = 'working';
        saveState();
        showToast('출근 도장이 찍혔습니다! 사장님께 근무 시작이 전달됩니다.', 'info');
        renderSeekerView();
    }
};

// End Work (Seeker Checks-out)
window.handleEndWork = function(gigId) {
    const gigIndex = state.gigs.findIndex(g => g.id === gigId);
    if (gigIndex !== -1) {
        state.gigs[gigIndex].status = 'done';
        saveState();
        showToast('퇴근 도장이 찍혔습니다. 사장님 승인 후 정산됩니다.', 'info');
        renderSeekerView();
    }
};

// Approve Payment (Employer Pays)
window.handleApprovePayment = function(gigId) {
    const gigIndex = state.gigs.findIndex(g => g.id === gigId);
    if (gigIndex !== -1) {
        const gig = state.gigs[gigIndex];
        const hours = calculateHours(gig.startTime, gig.endTime);
        const earned = gig.pay * hours;

        // Add to seeker's earnings (since we simulate the same user on Seeker profile)
        state.seekerEarnings += earned;

        // Remove from list or archive (for MVP, we delete from gigs or mark fully resolved)
        state.gigs.splice(gigIndex, 1);

        saveState();
        showToast(`근무 수당 ${earned.toLocaleString()}원 송금이 완료되었습니다.`, 'success');

        if (document.getElementById('btn-employer').classList.contains('active')) {
            renderEmployerView();
        } else {
            renderSeekerView();
        }
    }
};

// Create a Gig (Employer) -> triggers AI matching search on the employer hero
document.getElementById('gig-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('gig-title').value;
    const pay = parseInt(document.getElementById('gig-hourly-pay').value);
    const startTime = document.getElementById('gig-start-time').value;
    const endTime = document.getElementById('gig-end-time').value;
    const location = document.getElementById('gig-location').value;
    const description = document.getElementById('gig-description').value || '추가 지침이 없습니다.';

    // Validation
    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    if (startH >= endH) {
        showToast('근무 종료 시간은 시작 시간보다 늦어야 합니다.', 'toast');
        return;
    }

    const newGig = {
        id: 'gig-' + Date.now(),
        title,
        employer: '역삼 틈새 카페',
        pay,
        startTime,
        endTime,
        location,
        description,
        status: 'waiting',
        workerName: null,
        workerRating: null
    };

    state.gigs.push(newGig);
    saveState();
    showToast('긴급 구인 공고가 등록되었습니다. 실시간으로 매칭이 시작됩니다.', 'employer');
    document.getElementById('gig-form').reset();

    setHeroStage('employer', 'searching');

    setTimeout(() => {
        // Auto-fulfill the seeker's reservation if this gig fits, otherwise it stays waiting
        handleNewGigPosted(newGig);
        renderEmployerHeroResult(newGig.id);
        renderEmployerView();
    }, 1400);
});

// Whenever a new gig is posted, check if it fulfills the seeker's pending reservation,
// and auto-complete the match if so. Falls back to a soft notification otherwise.
function handleNewGigPosted(gig) {
    if (state.seekerReservation) {
        const r = state.seekerReservation;
        const isMatch = isTimeWithin(r.startTime, r.endTime, gig.startTime, gig.endTime)
            && gig.location === r.location
            && isJobTypeMatch(r.jobType, gig.title);

        if (isMatch) {
            const gigIndex = state.gigs.findIndex(g => g.id === gig.id);
            state.gigs[gigIndex].status = 'matched';
            state.gigs[gigIndex].workerName = '홍길동';
            state.gigs[gigIndex].workerRating = 4.9;
            state.seekerReservation = null;
            saveState();

            showToast(`⚡ 예약 자동 매칭 완료! 예약해두신 조건과 일치하는 '${gig.title}' 알바가 즉시 매칭되었습니다.`, 'success');
            return true;
        }
    }

    // No active reservation matched: just let the seeker know if it fits their last search
    const timeMatches = isTimeWithin(
        state.seekerSchedule.startTime,
        state.seekerSchedule.endTime,
        gig.startTime,
        gig.endTime
    );
    const locationMatches = (gig.location === state.seekerSchedule.location);
    const jobMatches = isJobTypeMatch(state.seekerSchedule.jobType, gig.title);

    if (timeMatches && locationMatches && jobMatches) {
        showToast(`⚡ 알림: 내 조건과 딱 맞는 '${gig.title}'이 새로 등록되었습니다!`, 'info');
    }
    return false;
}

// --- 9. Simulator Utilities ---
function initSimulator() {
    const toggleBtn = document.getElementById('btn-toggle-sim');
    const simBody = document.getElementById('sim-body');

    toggleBtn.addEventListener('click', () => {
        simBody.classList.toggle('active');
        toggleBtn.classList.toggle('rotated');
    });

    // Reset Data
    document.getElementById('btn-sim-reset').addEventListener('click', () => {
        if (confirm('모든 데이터를 초기화하시겠습니까?')) {
            resetToDefault();
            showToast('데이터가 초기화되었습니다.', 'info');

            setHeroStage('seeker', 'idle');
            setHeroStage('employer', 'idle');

            if (document.getElementById('btn-seeker').classList.contains('active')) {
                renderSeekerView();
            } else {
                renderEmployerView();
            }
        }
    });

    // Add Mock Gigs
    document.getElementById('btn-sim-add-jobs').addEventListener('click', () => {
        const mockGigs = [
            {
                id: 'gig-mock-' + Date.now() + '-1',
                title: '레스토랑 식기세척',
                employer: '도산 파스타키친',
                pay: 13000,
                startTime: '12:00',
                endTime: '15:00',
                location: '서초구 서초동',
                description: '바쁜 점심 시간대 식기 세척 및 주방 보조 업무입니다.',
                status: 'waiting',
                workerName: null,
                workerRating: null
            },
            {
                id: 'gig-mock-' + Date.now() + '-2',
                title: '행사 주차 안내',
                employer: '코엑스 모빌리티',
                pay: 14000,
                startTime: '11:00',
                endTime: '15:00',
                location: '강남구 역삼동',
                description: '오전 야외 이벤트 주차 차선 정리 및 고객 안내 데스크 보조입니다.',
                status: 'waiting',
                workerName: null,
                workerRating: null
            },
            {
                id: 'gig-mock-' + Date.now() + '-3',
                title: '바리스타 보조',
                employer: '블루보틀 성수',
                pay: 12500,
                startTime: '13:00',
                endTime: '17:00',
                location: '성동구 성수동',
                description: '러시 아워에 가벼운 컵 정리, 원두 소분, 바 테이블 위생 정리 보조.',
                status: 'waiting',
                workerName: null,
                workerRating: null
            }
        ];

        state.gigs.push(...mockGigs);
        saveState();
        showToast('새로운 가상 구인 공고 3개가 생성되었습니다!', 'success');

        // Each newly generated gig can auto-fulfill a pending reservation
        mockGigs.forEach(gig => handleNewGigPosted(gig));

        if (document.getElementById('btn-seeker').classList.contains('active')) {
            renderSeekerView();
        } else {
            renderEmployerView();
        }
    });
}

// --- Helper Functions ---
function calculateHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM - (startH * 60 + startM)) / 60;
}


// --- 10. App Entrypoint ---
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    initViewSwitcher();
    initSimulator();

    renderSeekerView();
    renderEmployerView();

    // Land directly on the AI matching screen; restore a pending reservation if one exists
    if (state.seekerReservation) {
        renderSeekerHeroResult();
    } else {
        setHeroStage('seeker', 'idle');
    }
    setHeroStage('employer', 'idle');
});
