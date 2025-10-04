import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage // ✅ ใช้ Storage จาก AngularFire
  ) {}

  // ✅ สมัครสมาชิก + อัปโหลดรูป + คืน userCredential
  async register(
    username: string,
    email: string,
    password: string,
    file?: File
  ) {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const uid = cred.user.uid;

    let avatarUrl = '';
    if (file) {
      const path = `profile/${uid}/${file.name}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file);
      avatarUrl = await getDownloadURL(storageRef);
    }

    // คืนค่า userCredential + แนบ avatarUrl เพื่อให้ component ใช้ต่อได้
    return { user: cred.user, avatarUrl };
  }

  // ✅ ฟังก์ชันบันทึกข้อมูลเพิ่มใน Firestore
  async saveUserToDB(userData: {
    uid: string;
    username: string;
    email: string;
    userType: string;
    avatar?: string | null;
  }) {
    const userRef = doc(this.firestore, 'users', userData.uid);
    await setDoc(userRef, {
      uid: userData.uid,
      username: userData.username,
      email: userData.email,
      photoURL: userData.avatar || '',
      userType: userData.userType,
      createdAt: new Date(),
    });

    await signOut(this.auth);
  }

  // ✅ ล็อกอิน + ดึงข้อมูล Firestore
  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = cred.user.uid;

    const userRef = doc(this.firestore, 'users', uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) throw new Error('ไม่พบบัญชีในฐานข้อมูล Firestore ❌');

    const userData = snap.data();
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  }
}
