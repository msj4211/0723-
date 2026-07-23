var firebaseConfig = {
    apiKey: "AIzaSyCHVz2Do-o0J6EisfUVTp51Pp3GhnPVrPE",
    authDomain: "skineartherapy.firebaseapp.com",
    projectId: "skineartherapy",
    storageBucket: "skineartherapy.firebasestorage.app",
    messagingSenderId: "107641487330",
    appId: "1:107641487330:web:e9ee7370782fb509b603bb"
};

firebase.initializeApp(firebaseConfig);

window.earPointsDb = firebase.firestore();