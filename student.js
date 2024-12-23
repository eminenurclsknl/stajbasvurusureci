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

function loadTeachers() {
    const teacherSelect = document.getElementById('teacherSelect');
    database.ref('users').orderByChild('role').equalTo('teacher').once('value')
        .then(snapshot => {
            snapshot.forEach(childSnapshot => {
                const teacher = childSnapshot.val();
                const option = document.createElement('option');
                option.value = childSnapshot.key; // Teacher ID
                option.textContent = `${teacher.name} (${teacher.email})`;
                teacherSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Öğretmenler yüklenirken hata oluştu:', error);
            alert('Öğretmenler yüklenirken bir hata oluştu.');
        });
}

function loadStudentInfo() {
    const user = auth.currentUser;
    if (user) {

        const userId = user.uid;
        database.ref('users/' + userId).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                if (userData) {
                    document.getElementById('studentName').textContent = userData.name || 'Ad Soyad';
                    document.getElementById('studentNumber').textContent = userData.studentNumber || 'Öğrenci No';
                    document.getElementById('studentClass').textContent = userData.studentClass || 'Sınıf';
                }
            })
            .catch(error => {
                console.error('Öğrenci bilgileri yüklenirken hata oluştu:', error);
                alert('Öğrenci bilgileri yüklenirken bir hata oluştu.');
            });
    } else {
        
        window.location.href = 'index.html';
    }
}

document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const user = auth.currentUser;
    if (!user) {
        alert('Oturumunuz kapalı. Lütfen tekrar giriş yapınız.');
        window.location.href = 'index.html';
        return;
    }

    const userId = user.uid;

    const pdfFile = document.getElementById('pdfFile').files[0];
    const teacherId = document.getElementById('teacherSelect').value;

    if (!pdfFile) {
        alert('Lütfen bir PDF dosyası seçiniz.');
        return;
    }

    if (!teacherId) {
        alert('Lütfen bir öğretmen seçiniz.');
        return;
    }

    const uploadMessage = document.getElementById('uploadMessage');
    uploadMessage.textContent = 'Yükleniyor...';
    uploadMessage.style.color = 'white';


    const storageRef = storage.ref(`applications/${userId}/${pdfFile.name}`);
    const uploadTask = storageRef.put(pdfFile);

    uploadTask.on('state_changed', 
        (snapshot) => {

            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadMessage.textContent = `Yükleme: ${Math.round(progress)}%`;
        }, 
        (error) => {
            console.error('PDF yüklenirken hata oluştu:', error);
            uploadMessage.textContent = 'Yükleme sırasında bir hata oluştu.';
            uploadMessage.style.color = 'red';
        }, 
        () => {

            uploadTask.snapshot.ref.getDownloadURL()
                .then((downloadURL) => {

                    const applicationKey = database.ref().child('applications').push().key;
                    const applicationData = {
                        applicationId: applicationKey,
                        studentId: userId,
                        studentName: document.getElementById('studentName').textContent,
                        studentNumber: document.getElementById('studentNumber').textContent,
                        studentClass: document.getElementById('studentClass').textContent,
                        studentEmail: user.email,
                        teacherId: teacherId,
                        pdfUrl: downloadURL,
                        teacherStatus: 'Beklemede',
                        sgkStatus: 'Beklemede',
                        overallStatus: 'Beklemede',
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    };

                    return database.ref('applications/' + applicationKey).set(applicationData);
                })
                .then(() => {
                    uploadMessage.textContent = 'PDF başarıyla yüklendi ve öğretmene gönderildi.';
                    uploadMessage.style.color = 'lightgreen';
                    document.getElementById('uploadForm').reset();
                })
                .catch(error => {
                    console.error('Uygulama kaydedilirken hata oluştu:', error);
                    uploadMessage.textContent = 'Uygulama kaydedilirken bir hata oluştu.';
                    uploadMessage.style.color = 'red';
                });
        }
    );
});

function loadApplicationStatus() {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        
        database.ref('applications').orderByChild('studentId').equalTo(userId).on('value', snapshot => {
            const approvalStatus = document.getElementById('approvalStatus');
            approvalStatus.innerHTML = ''; 
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const app = childSnapshot.val();
                    const card = document.createElement('div');
                    card.classList.add('application-card');

                    let statusClass = '';
                    let statusText = '';
                    if (app.overallStatus === 'Onaylandı') {
                        statusClass = 'status-approved';
                        statusText = 'Onaylandı';
                    } else if (app.overallStatus === 'Reddedildi') {
                        statusClass = 'status-rejected';
                        statusText = `Reddedildi - Sebep: ${app.rejectionReason || 'Belirtilmemiş'}`;
                    } else {
                        statusText = app.overallStatus;
                    }

         
                    const formattedDate = app.timestamp ? new Date(app.timestamp).toLocaleString() : 'Tarih Yok';

                   
                    card.innerHTML = `
                        <h3 class="basvuru-btn" >Başvuru:</h3>
                        <p><strong>Durum:</strong> <span class="${statusClass}">${statusText}</span></p>
                        <p><strong>Tarih:</strong> ${formattedDate}</p>
                    `;

                    approvalStatus.appendChild(card);
                });
            } else {
                approvalStatus.innerHTML = '<p>Henüz bir onay durumu yok.</p>';
            }
        });
    }
}


document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Çıkış işlemi sırasında hata oluştu:', error);
        alert('Çıkış yaparken bir hata oluştu.');
    });
});

auth.onAuthStateChanged((user) => {
    if (user) {
        loadStudentInfo();
        loadTeachers();
        loadApplicationStatus();
    } else {
        window.location.href = 'index.html';
    }
});
