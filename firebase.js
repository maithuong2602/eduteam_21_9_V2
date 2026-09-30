const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, getDoc, updateDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCQ3FB_rDzlssI_clkbm4Cq_0Ebpi6IhtE",
  authDomain: "dayhoctuongtac.firebaseapp.com",
  projectId: "dayhoctuongtac",
  storageBucket: "dayhoctuongtac.firebasestorage.app",
  messagingSenderId: "410831223532",
  appId: "1:410831223532:web:174952140f89f8fc43c3c9",
  measurementId: "G-MVZK9BYFPZ"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

module.exports = { firestore, doc, setDoc, getDoc, updateDoc };
