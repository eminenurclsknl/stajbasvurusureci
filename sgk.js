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


function loadSGKInfo() {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        database.ref('users/' + userId).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                if (userData && userData.role === 'sgk') {

                    loadApplications();
                } else {
               
                    alert('Bu sayfaya erişim izniniz yok.');
                    auth.signOut();
                    window.location.href = 'index.html';
                }
            })
            .catch(error => {
                console.error('SGK bilgileri yüklenirken hata oluştu:', error);
                alert('SGK bilgileri yüklenirken bir hata oluştu.');
                auth.signOut();
                window.location.href = 'index.html';
            });
    } else {
      
        window.location.href = 'index.html';
    }
}

// Uygulamaları yükle ve tabloyu doldur
function loadApplications() {
    const sgkApplicationsTableBody = document.getElementById('sgkApplicationsTableBody');
    sgkApplicationsTableBody.innerHTML = ''; // Temizle

    // İlk sorgu: sgkStatus "Beklemede" olan başvuruları çek
    database.ref('applications')
        .orderByChild('sgkStatus').equalTo('Beklemede')
        .on('value', snapshot => {
            sgkApplicationsTableBody.innerHTML = ''; 
            if (snapshot.exists()) {
                let hasApplications = false;
                snapshot.forEach(childSnapshot => {
                    const app = childSnapshot.val();
 
                    if (app.teacherStatus === 'Onaylandı') {
                        hasApplications = true;
                        const tr = document.createElement('tr');

                        tr.innerHTML = `
                            <td>${app.studentNumber}</td>
                            <td>${app.studentName}</td>
                            <td><a href="${app.pdfUrl}" target="_blank" style="color: #088fce;">PDF Dosyasını Görüntüle</a></td>
                            <td>${app.sgkStatus}</td>
                            <td>
                                <button class="approve-btn" data-key="${childSnapshot.key}">Onayla</button>
                            </td>
                        `;

                        sgkApplicationsTableBody.appendChild(tr);
                    }
                });
                if (!hasApplications) {
                    sgkApplicationsTableBody.innerHTML = '<tr><td colspan="5">Onay bekleyen başvuru yok.</td></tr>';
                }
            } else {
                sgkApplicationsTableBody.innerHTML = '<tr><td colspan="5">Onay bekleyen başvuru yok.</td></tr>';
            }
        });
}



document.getElementById('sgkApplicationsTableBody').addEventListener('click', function(event) {
    if (event.target.classList.contains('approve-btn')) {
        const applicationKey = event.target.getAttribute('data-key');
        approveApplication(applicationKey);
    }
});


function approveApplication(applicationKey) {
    const updates = {
        sgkStatus: 'Onaylandı',
        overallStatus: 'Onaylandı'
    };
    database.ref('applications/' + applicationKey).update(updates)
        .then(() => {
            alert('Başvuru onaylandı ve öğrenciye bildirildi.');
        })
        .catch(error => {
            console.error('Başvuru onaylanırken hata oluştu:', error);
            alert('Başvuru onaylanırken bir hata oluştu.');
        });
}


auth.onAuthStateChanged((user) => {
    if (user) {
        loadSGKInfo();
    } else {
        window.location.href = 'index.html';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Çıkış işlemi sırasında hata oluştu:', error);
        alert('Çıkış yaparken bir hata oluştu.');
    });
});