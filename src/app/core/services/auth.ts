import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage
  ) {}

  // ✅ สมัครสมาชิก + บันทึก Firestore
  async register(username: string, email: string, password: string, file?: File) {
    // สร้าง user ใน Firebase Auth
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = cred.user.uid;

    // ถ้ามีรูป -> อัปโหลดไป Storage
    let photoURL = '';
    if (file) {
      const path = `profile/${uid}/${file.name}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
    }

    // บันทึกข้อมูลใน Firestore
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, {
      uid,
      username,
      email,
      photoURL,
      createdAt: new Date(),
      role: 'user'
    });

    return cred.user;
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
