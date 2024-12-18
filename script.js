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

// Giriş formunu dinle
document.getElementById('Login').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    
    // Giriş yap
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (user) {
                const userId = user.uid;

                return database.ref('users/' + userId).once('value');
            }
        })
        .then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                const role = userData.role;
                if (role === 'student') {
                    window.location.href = 'student.html';
                } else if (role === 'teacher') {
                    window.location.href = 'teacher.html';
                } else if (role === 'sgk') {
                    window.location.href = 'sgk.html';
                } else {
                    alert('Geçersiz kullanıcı rolü. Lütfen doğru bir kullanıcı adı giriniz.');
                    auth.signOut();
                }
            } else {
                alert('Kullanıcı verisi bulunamadı.');
                auth.signOut();
            }
        })
        .catch((error) => {
            console.error('Giriş hatası:', error);
            alert('Giriş yapılamadı. Lütfen email ve parolanızı kontrol ediniz.');
        });
});


auth.onAuthStateChanged((user) => {
    if (user) {
        const userId = user.uid;

        database.ref('users/' + userId).once('value')
            .then((snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    const role = userData.role;
                    if (role === 'student') {
                        window.location.href = 'student.html';
                    } else if (role === 'teacher') {
                        window.location.href = 'teacher.html';
                    } else if (role === 'sgk') {
                        window.location.href = 'sgk.html';
                    }
                }
            })
            .catch((error) => {
                console.error('Oturum durumu kontrol edilirken hata oluştu:', error);
            });
    }
});
