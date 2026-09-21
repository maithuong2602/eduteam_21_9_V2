const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes } = require('firebase/storage');

const firebaseConfig = {
  apiKey: "AIzaSyA503GJaX6uFJEZYI5ICjSz-xKeCFHQ7Oo",
  authDomain: "eduteam-d0d9e.firebaseapp.com",
  projectId: "eduteam-d0d9e",
  storageBucket: "eduteam-d0d9e.appspot.com",
  messagingSenderId: "191055580870",
  appId: "1:191055580870:web:df62022f8847c263c851c7"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function test() {
  try {
    const storageRef = ref(storage, 'test2.txt');
    await uploadBytes(storageRef, new Uint8Array(Buffer.from('hello')));
    console.log('SUCCESS');
  } catch(e) {
    console.log('ERROR:', e.message);
  }
}
test();
