/**
 * 틈타 (Teumta) - Employer App Logic
 * Data comes from ../shared/db.js (localStorage + cross-tab sync today, Firestore-ready shape).
 * Matching math comes from ../shared/matching.js.
 */

// --- Toast Alert Helper ---
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

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

// --- AI Matching Hero Stage Machine (idle / searching / result) ---
function setHeroStage(stage) {
    const idle = document.getElementById('employer-hero-idle');
    const searching = document.getElementById('employer-hero-searching');
    const result = document.getElementById('employer-hero-result');

    [idle, searching, result].forEach(el => el.classList.remove('active'));
    if (stage === 'idle') idle.classList.add('active');
    if (stage === 'searching') searching.classList.add('active');
    if (stage === 'result') result.classList.add('active');
}

window.resetEmployerHero = function() {
    setHeroStage('idle');
};

function renderHeroResult(gigId) {
    const panel = document.getElementById('employer-hero-result');
    const state = db.getState();
    const gig = state.gigs.find(g => g.id === gigId);
    if (!gig) {
        setHeroStage('idle');
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
    setHeroStage('result');
}

// --- Render ---
function render(state) {
    const myPosted = state.gigs.length;
    const myMatched = state.gigs.filter(g => g.status !== 'waiting').length;

    document.getElementById('employer-active-gigs').textContent = myPosted;
    document.getElementById('employer-matched-gigs').textContent = myMatched;

    const gigList = document.getElementById('employer-gig-list');

    if (state.gigs.length === 0) {
        gigList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>아직 등록하신 구인 공고가 없습니다.<br>위 폼을 이용해 첫 긴급 구인을 시작해 보세요!</p>
            </div>
        `;
        return;
    }

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
                        <span class="worker-rating"><i class="fa-solid fa-star"></i> ${gig.workerRating}</span>
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

// --- Actions ---
document.getElementById('gig-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('gig-title').value;
    const pay = parseInt(document.getElementById('gig-hourly-pay').value);
    const startTime = document.getElementById('gig-start-time').value;
    const endTime = document.getElementById('gig-end-time').value;
    const location = document.getElementById('gig-location').value;
    const description = document.getElementById('gig-description').value || '추가 지침이 없습니다.';

    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    if (startH >= endH) {
        showToast('근무 종료 시간은 시작 시간보다 늦어야 합니다.', 'toast');
        return;
    }

    const gig = db.postGig({
        title, employer: '역삼 틈새 카페', pay, startTime, endTime, location, description
    });

    showToast('긴급 구인 공고가 등록되었습니다. 실시간으로 매칭이 시작됩니다.', 'employer');
    document.getElementById('gig-form').reset();

    setHeroStage('searching');

    setTimeout(() => {
        // Auto-fulfill a pending seeker reservation if this gig fits, otherwise it stays waiting
        checkReservationMatch(gig);
        renderHeroResult(gig.id);
    }, 1400);
});

// Whenever a new gig is posted, check if it fulfills the seeker's pending reservation.
function checkReservationMatch(gig) {
    const state = db.getState();
    const r = state.seekerReservation;
    if (!r) return false;

    const matches = findMatchingGigs([gig], r, r.radiusKm);
    if (matches.length > 0) {
        db.matchGig(gig.id, '홍길동', 4.9);
        showToast(`⚡ 예약 자동 매칭 완료! 예약해두신 조건과 일치하는 '${gig.title}' 알바가 즉시 매칭되었습니다.`, 'success');
        return true;
    }
    return false;
}

window.handleApprovePayment = function(gigId) {
    const gig = db.approvePayment(gigId);
    if (!gig) return;
    const hours = calculateHours(gig.startTime, gig.endTime);
    const earned = gig.pay * hours;
    db.addEarnings(earned);
    showToast(`근무 수당 ${earned.toLocaleString()}원 송금이 완료되었습니다.`, 'success');
};

// --- Simulator Utilities ---
function initSimulator() {
    const toggleBtn = document.getElementById('btn-toggle-sim');
    const simBody = document.getElementById('sim-body');

    toggleBtn.addEventListener('click', () => {
        simBody.classList.toggle('active');
        toggleBtn.classList.toggle('rotated');
    });

    document.getElementById('btn-sim-reset').addEventListener('click', () => {
        if (confirm('모든 데이터를 초기화하시겠습니까? (구직자/사장님 앱 양쪽 모두 초기화됩니다)')) {
            db.resetToDefault();
            showToast('데이터가 초기화되었습니다.', 'info');
            setHeroStage('idle');
        }
    });

    document.getElementById('btn-sim-add-jobs').addEventListener('click', () => {
        const mockGigs = [
            { title: '레스토랑 식기세척', employer: '도산 파스타키친', pay: 13000, startTime: '12:00', endTime: '15:00', location: '서초구 서초동', description: '바쁜 점심 시간대 식기 세척 및 주방 보조 업무입니다.' },
            { title: '행사 주차 안내', employer: '코엑스 모빌리티', pay: 14000, startTime: '11:00', endTime: '15:00', location: '강남구 역삼동', description: '오전 야외 이벤트 주차 차선 정리 및 고객 안내 데스크 보조입니다.' },
            { title: '바리스타 보조', employer: '블루보틀 성수', pay: 12500, startTime: '13:00', endTime: '17:00', location: '성동구 성수동', description: '러시 아워에 가벼운 컵 정리, 원두 소분, 바 테이블 위생 정리 보조.' }
        ];
        mockGigs.forEach(g => {
            const gig = db.postGig(g);
            checkReservationMatch(gig);
        });
        showToast('새로운 가상 구인 공고 3개가 생성되었습니다!', 'success');
    });
}

// --- Helper ---
function calculateHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM - (startH * 60 + startM)) / 60;
}

// --- App Entrypoint ---
window.addEventListener('DOMContentLoaded', () => {
    initSimulator();
    db.subscribe(render);
});
