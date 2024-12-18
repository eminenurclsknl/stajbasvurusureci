const firebaseConfig = {
    apiKey: "AIzaSyBT66McqcPqJgynTNOGD1yfeY2mvfP6rz4",
    authDomain: "instagram-817f4.firebaseapp.com",
    databaseURL: "https://instagram-817f4-default-rtdb.firebaseio.com",
    projectId: "instagram-817f4",
    storageBucket: "instagram-817f4.appspot.com",
    messagingSenderId: "977145960476",
    appId: "1:977145960476:web:34f99c0289f3021f4027d9",
    measurementId: "G-CLHQF35XKW"
};


firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();


function loadTeacherInfo() {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        database.ref('users/' + userId).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.role === 'teacher') {

                    loadApplications(userId);
                } else {

                    alert('Bu sayfaya erişim izniniz yok.');
                    auth.signOut();
                    window.location.href = 'index.html';
                }
            })
            .catch(error => {
                console.error('Öğretmen bilgileri yüklenirken hata oluştu:', error);
                alert('Öğretmen bilgileri yüklenirken bir hata oluştu.');
                auth.signOut();
                window.location.href = 'index.html';
            });
    } else {

        window.location.href = 'index.html';
    }
}


function loadApplications(teacherId) {
    const applicationsTableBody = document.getElementById('applicationsTableBody');
    applicationsTableBody.innerHTML = ''; 
    database.ref('applications').orderByChild('teacherId').equalTo(teacherId).on('value', snapshot => {
        applicationsTableBody.innerHTML = ''; 
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const app = childSnapshot.val();
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>${app.studentNumber}</td>
                    <td>${app.studentName}</td>
                    <td><a href="${app.pdfUrl}" target="_blank" style="color: #088fce;">PDF Dosyasını Görüntüle</a></td>
                    <td>${app.teacherStatus}</td>
                    <td>${app.rejectionReason ? app.rejectionReason : 'N/A'}</td>
                    <td>
                        ${app.teacherStatus === 'Beklemede' ? `
                            <button class="approve-btn" data-key="${childSnapshot.key}">Onayla</button>
                            <button class="reject-btn" data-key="${childSnapshot.key}">Reddet</button>
                        ` : `
                            <span>İşlem Yapıldı</span>
                        `}
                    </td>
                `;

                applicationsTableBody.appendChild(tr);
            });
        } else {
            applicationsTableBody.innerHTML = '<tr><td colspan="6">Bekleyen başvuru yok.</td></tr>';
        }
    });
}

document.getElementById('applicationsTableBody').addEventListener('click', function(event) {
    if (event.target.classList.contains('approve-btn')) {
        const applicationKey = event.target.getAttribute('data-key');
        approveApplication(applicationKey);
    }

    if (event.target.classList.contains('reject-btn')) {
        const applicationKey = event.target.getAttribute('data-key');
        rejectApplication(applicationKey);
    }
});

function approveApplication(applicationKey) {
    const updates = {
        teacherStatus: 'Onaylandı',
        sgkStatus: 'Beklemede',
        overallStatus: 'Beklemede'
    };
    database.ref('applications/' + applicationKey).update(updates)
        .then(() => {
            alert('Başvuru onaylandı ve SGK\'ya gönderildi.');
        })
        .catch(error => {
            console.error('Başvuru onaylanırken hata oluştu:', error);
            alert('Başvuru onaylanırken bir hata oluştu.');
        });
}


function rejectApplication(applicationKey) {

    const reason = prompt('Reddetme sebebinizi giriniz:');
    
    if (reason === null || reason.trim() === '') {
        alert('Reddetme sebebi girmek zorunludur.');
        return;
    }

    const updates = {
        teacherStatus: 'Reddedildi',
        overallStatus: 'Reddedildi',
        rejectionReason: reason.trim()
    };
    
    database.ref('applications/' + applicationKey).update(updates)
        .then(() => {
            alert('Başvuru reddedildi.');
        })
        .catch(error => {
            console.error('Başvuru reddedilirken hata oluştu:', error);
            alert('Başvuru reddedilirken bir hata oluştu.');
        });
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        alert('Başarıyla çıkış yaptınız.');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Çıkış yaparken hata oluştu:', error);
        alert('Çıkış yaparken bir hata oluştu.');
    });
});


auth.onAuthStateChanged((user) => {
    if (user) {
        loadTeacherInfo();
    } else {
        window.location.href = 'index.html';
    }
});
