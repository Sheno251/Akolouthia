// الأسماء الكاملة (12 عضو + 3 أدمن)
const allNames = [
    "مارتيورس جمال", "نرمين فرج الله", "ميرنا فام", "بيشوي صفوت", "شنوده نصحي", "سيلفيا طلعت", "سيمون سمعان", "كرستينا ميلاد", "ماري بشاي", "ابانوب فرج الله", "امال عادل", "باسم جابر",  // 12 عضو
    "هاله عادل", "دميانه سمعان", "فام روماني",",ويصا مرزق","ماري هاني ","مينا فام","فيولا طلعت"  // 3 أدمن
];

// الأدمن
const admins = [
    { username: "admin1", password: "admin123" },
    { username: "admin2", password: "admin123" },
    { username: "admin3", password: "admin123" }
];

const MONTHS_COUNT = 12;

const statusText = {
    'present': 'حاضر ✅',
    'late': 'متأخر ⏰',
    'absent': 'غائب بدون عذر ❌',
    'excused': 'غائب بعذر 📝'
};

let currentMember = null;
let currentMonth = 0;

// -------------------- تخزين البيانات --------------------
function loadData() {
    let data = localStorage.getItem('attendanceData');
    if (!data) {
        data = {};
        allNames.forEach(name => {
            data[name] = [];
            for (let i = 0; i < MONTHS_COUNT; i++) {
                data[name][i] = [];
            }
        });
    } else {
        data = JSON.parse(data);
        allNames.forEach(name => {
            if (!data[name]) data[name] = [];
            for (let i = 0; i < MONTHS_COUNT; i++) {
                if (!data[name][i]) data[name][i] = [];
            }
        });
    }
    return data;
}

function saveData(data) {
    localStorage.setItem('attendanceData', JSON.stringify(data));
}

// -------------------- الموعد الرسمي --------------------
function getOfficialTime() {
    let time = localStorage.getItem('officialTime');
    if (!time) {
        time = '09:00';
        localStorage.setItem('officialTime', time);
    }
    return time;
}

function updateOfficialTime() {
    const newTime = document.getElementById('newOfficialTime').value;
    if (!newTime) {
        alert('اختر الوقت أولاً');
        return;
    }
    localStorage.setItem('officialTime', newTime);
    document.getElementById('currentOfficialTime').textContent = newTime;
    alert(`تم تغيير الموعد الرسمي إلى ${newTime}`);
}

function calculateLateMinutes(actualHour, actualMinute) {
    const officialTime = getOfficialTime();
    const [officialHour, officialMinute] = officialTime.split(':').map(Number);
    let lateMinutes = (actualHour - officialHour) * 60 + (actualMinute - officialMinute);
    return lateMinutes > 0 ? lateMinutes : 0;
}

// -------------------- نافذة التأخير --------------------
function showLateDialog() {
    document.getElementById('lateDialog').classList.remove('hidden');
    const officialTime = getOfficialTime();
    document.querySelector('#lateDialog p').innerHTML = `الموعد الرسمي: ${officialTime}`;
}

function closeLateDialog() {
    document.getElementById('lateDialog').classList.add('hidden');
}

function recordLate() {
    const actualTime = document.getElementById('actualTime').value;
    if (!actualTime) {
        alert('يرجى إدخال وقت الحضور');
        return;
    }
    const [hour, minute] = actualTime.split(':').map(Number);
    const lateMinutes = calculateLateMinutes(hour, minute);
    
    const data = loadData();
    if (!data[currentMember][currentMonth]) data[currentMember][currentMonth] = [];
    
    data[currentMember][currentMonth].push({
        status: 'late',
        time: new Date().toLocaleTimeString('ar-EG'),
        date: new Date().toLocaleDateString('ar-EG'),
        lateMinutes: lateMinutes,
        actualTime: actualTime
    });
    
    saveData(data);
    closeLateDialog();
    updateMemberView();
}

// -------------------- تسجيل الحالات --------------------
function recordStatus(status) {
    if (!currentMember) return;
    
    const data = loadData();
    if (!data[currentMember][currentMonth]) data[currentMember][currentMonth] = [];
    
    data[currentMember][currentMonth].push({
        status: status,
        time: new Date().toLocaleTimeString('ar-EG'),
        date: new Date().toLocaleDateString('ar-EG')
    });
    
    saveData(data);
    updateMemberView();
}

// -------------------- إعادة تعيين شهر --------------------
function resetCurrentMonth() {
    if (!confirm(`هل أنت متأكد من حذف جميع بيانات شهر ${currentMonth + 1}؟ لا يمكن التراجع.`)) return;
    
    const data = loadData();
    allNames.forEach(name => {
        data[name][currentMonth] = [];
    });
    saveData(data);
    alert(`تم حذف بيانات شهر ${currentMonth + 1} بنجاح`);
    updateAdminView();
}

// -------------------- حساب النسب --------------------
function calculatePersonalStats(name, month) {
    const data = loadData();
    const records = data[name][month] || [];
    const total = records.length;
    
    let present = 0, excused = 0, absent = 0;
    let totalLateMinutes = 0;
    let lateCount = 0;
    
    records.forEach(r => {
        if (r.status === 'present' || r.status === 'late') {
            present++;
            if (r.status === 'late') {
                lateCount++;
                totalLateMinutes += r.lateMinutes || 0;
            }
        }
        else if (r.status === 'excused') excused++;
        else if (r.status === 'absent') absent++;
    });
    
    return {
        presentRate: total ? Math.round((present / total) * 100) : 0,
        excusedRate: total ? Math.round((excused / total) * 100) : 0,
        absentRate: total ? Math.round((absent / total) * 100) : 0,
        total: total,
        totalLateMinutes: totalLateMinutes,
        lateCount: lateCount,
        avgLate: lateCount ? Math.round(totalLateMinutes / lateCount) : 0
    };
}

// -------------------- عرض الأعضاء --------------------
function showMemberList() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('memberScreen').classList.remove('hidden');
    
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';
    allNames.forEach(name => {
        const card = document.createElement('div');
        card.className = 'member-card';
        card.textContent = name;
        card.onclick = () => openMemberDashboard(name);
        memberList.appendChild(card);
    });
}

function openMemberDashboard(name) {
    currentMember = name;
    currentMonth = 0;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('memberDashboard').classList.remove('hidden');
    document.getElementById('memberName').textContent = name;
    renderMonthsTabs('memberMonthsTabs', true);
    updateMemberView();
}

function updateMemberView() {
    const data = loadData();
    const records = data[currentMember][currentMonth] || [];
    const lastRecord = records[records.length - 1];
    
    const currentStatusDiv = document.getElementById('currentStatus');
    if (lastRecord) {
        let lateInfo = '';
        if (lastRecord.status === 'late') {
            lateInfo = `<br><small>⏱️ تأخر ${lastRecord.lateMinutes} دقيقة - حضر الساعة ${lastRecord.actualTime}</small>`;
        }
        currentStatusDiv.innerHTML = `
            <strong>آخر تسجيل:</strong><br>
            ${statusText[lastRecord.status]}${lateInfo}<br>
            <small>${lastRecord.date} - ${lastRecord.time}</small>
        `;
    } else {
        currentStatusDiv.innerHTML = 'لا توجد تسجيلات لهذا الشهر';
    }
    
    const stats = calculatePersonalStats(currentMember, currentMonth);
    document.getElementById('personalStats').innerHTML = `
        <p>✅ الحضور (حاضر + متأخر): ${stats.presentRate}%</p>
        <p>📝 الغياب بعذر: ${stats.excusedRate}%</p>
        <p>❌ الغياب بدون عذر: ${stats.absentRate}%</p>
        <p>📊 إجمالي التسجيلات: ${stats.total}</p>
        ${stats.lateCount > 0 ? `<p>⏰ عدد مرات التأخير: ${stats.lateCount}</p>
        <p>⏱️ متوسط التأخير: ${stats.avgLate} دقيقة</p>` : ''}
    `;
}

function renderMonthsTabs(containerId, isMember = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < MONTHS_COUNT; i++) {
        const btn = document.createElement('button');
        btn.className = `month-tab ${i === currentMonth ? 'active' : ''}`;
        btn.textContent = `شهر ${i + 1}`;
        btn.dataset.month = i;
        btn.onclick = () => {
            document.querySelectorAll(`#${containerId} .month-tab`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMonth = i;
            if (isMember) updateMemberView();
            else updateAdminView();
        };
        container.appendChild(btn);
    }
}

// -------------------- الأدمن --------------------
function showAdminLogin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('adminLoginScreen').classList.remove('hidden');
}

function verifyAdmin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const admin = admins.find(a => a.username === username && a.password === password);
    if (admin) {
        showAdminDashboard();
    } else {
        alert('اسم المستخدم أو كلمة السر خطأ');
    }
}

function showAdminDashboard() {
    currentMonth = 0;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('adminDashboard').classList.remove('hidden');
    renderMonthsTabs('adminMonthsTabs', false);
    const officialTimeElement = document.getElementById('currentOfficialTime');
    if (officialTimeElement) officialTimeElement.textContent = getOfficialTime();
    updateAdminView();
}

function updateAdminView() {
    const stats = [];
    
    allNames.forEach(name => {
        const personalStats = calculatePersonalStats(name, currentMonth);
        stats.push({ name, ...personalStats });
    });
    
    const bestAttendance = [...stats].sort((a,b) => b.presentRate - a.presentRate)[0];
    const worstAbsence = [...stats].sort((a,b) => b.absentRate - a.absentRate)[0];
    const mostLate = [...stats].sort((a,b) => b.lateCount - a.lateCount)[0];
    
    const adminStatsDiv = document.getElementById('adminStats');
    if (adminStatsDiv) {
        adminStatsDiv.innerHTML = `
            <div class="stats">
                <h3>📊 إحصائيات شهر ${currentMonth + 1}</h3>
                <p>🏆 أعلى نسبة حضور: ${bestAttendance?.name || '-'} (${bestAttendance?.presentRate || 0}%)</p>
                <p>⚠️ أعلى نسبة غياب بدون عذر: ${worstAbsence?.name || '-'} (${worstAbsence?.absentRate || 0}%)</p>
                <p>⏰ أكثر عضو تأخيراً: ${mostLate?.name || '-'} (${mostLate?.lateCount || 0} مرة - متوسط ${mostLate?.avgLate || 0} دقيقة)</p>
            </div>
        `;
    }
    
    let html = `<table><thead><th>الاسم</th><th>حضور + متأخر</th><th>غياب بعذر</th><th>غياب بدون عذر</th><th>عدد مرات التأخير</th><th>متوسط التأخير(دق)</th><th>إجمالي</th></thead><tbody>`;
    stats.forEach(s => {
        html += `<tr>
            <td>${s.name}</td>
            <td style="color:#48bb78;">${s.presentRate}%</td>
            <td style="color:#4299e1;">${s.excusedRate}%</td>
            <td style="color:#f56565;">${s.absentRate}%</td>
            <td>${s.lateCount}</td>
            <td>${s.avgLate}</td>
            <td>${s.total}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    const tableDiv = document.getElementById('allMembersTable');
    if (tableDiv) tableDiv.innerHTML = html;
}

// -------------------- دوال التنقل --------------------
function backToLogin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('loginScreen').classList.remove('hidden');
}

function backToMemberList() {
    showMemberList();
}