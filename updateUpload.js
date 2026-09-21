const fs = require('fs');

const uploadCode = `
import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA503GJaX6uFJEZYI5ICjSz-xKeCFHQ7Oo",
  authDomain: "eduteam-d0d9e.firebaseapp.com",
  projectId: "eduteam-d0d9e",
  storageBucket: "eduteam-d0d9e.firebasestorage.app",
  messagingSenderId: "191055580870",
  appId: "1:191055580870:web:df62022f8847c263c851c7"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as any;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = \`\${Date.now()}_\${file.name}\`;
    const storageRef = ref(storage, \`presentations/\${fileName}\`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, new Uint8Array(buffer), {
      contentType: 'application/pdf',
    });

    // Get the URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Return the proxy URL so frontend bypasses CORS issues
    return NextResponse.json({
      success: true,
      fileUrl: \`/api/proxy?url=\${encodeURIComponent(downloadURL)}\`,
      id: fileName
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to Firebase', details: (error as Error).message },
      { status: 500 }
    );
  }
}
`;
fs.writeFileSync('src/app/api/upload/route.ts', uploadCode.trim());
console.log('Updated upload/route.ts');
