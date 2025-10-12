import { Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  user,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ✅ ใช้ signal เก็บสถานะผู้ใช้
  currentUser = signal<any | null>(null);
  private authChecked = signal(false); // ✅ เพิ่ม signal เพื่อบอกว่าเช็ค auth state แล้ว

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    // ✅ ฟังการเปลี่ยนสถานะของ Firebase
    onAuthStateChanged(this.auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(
            doc(this.firestore, 'users', firebaseUser.uid)
          );
          if (snap.exists()) {
            const userData = { uid: firebaseUser.uid, ...snap.data() };
            this.currentUser.set(userData);
            // ✅ เก็บใน localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Auth state changed: User logged in', userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          this.currentUser.set(null);
          localStorage.removeItem('user');
        }
      } else {
        this.currentUser.set(null);
        localStorage.removeItem('user');
      }
      this.authChecked.set(true);
    });
  }

  // ✅ รอให้ Firebase Auth โหลด session เสร็จและคืน user ให้ component
async waitForSessionUser(): Promise<any | null> {
  // ถ้ามีใน localStorage อยู่แล้ว คืนเลย
  const cached = this.getUserFromSession();
  if (cached) return cached;

  // ถ้า Firebase ยังไม่เช็คสถานะ login เสร็จ ให้รอ
  if (!this.authChecked()) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (this.authChecked()) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  // ตอนนี้ Firebase เช็คสถานะเสร็จแล้ว — ดู currentUser()
  const current = this.currentUser();
  if (current) return current;

  // เผื่อกรณีไม่มี currentUser แต่มีใน localStorage
  return this.getUserFromSession();
}


  // ✅ เปลี่ยนเป็น sessionStorage
  getUserFromSession() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // ✅ ตรวจสอบการล็อกอินจาก session
  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  // ✅ ฟังก์ชันรอให้ auth state พร้อม
  async waitForAuthCheck(): Promise<boolean> {
    if (!this.authChecked()) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.authChecked()) {
            clearInterval(checkInterval);
            resolve(this.isLoggedIn());
          }
        }, 100);
      });
    }
    return this.isLoggedIn();
  }
  // ✅ ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบัน
  getCurrentUser() {
    return this.currentUser();
  }

  async uploadToCloudinary(file: File): Promise<string> {
    const cloudName = 'dwkwzzm15'; // ← แก้เป็นของคุณ
    const uploadPreset = 'gameshop'; // ← preset ที่สร้างไว้

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset); // ✅ สำคัญมาก

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await res.json();

    if (data.secure_url) {
      console.log('Uploaded to Cloudinary:', data.secure_url);
      return data.secure_url;
    } else {
      throw new Error('อัปโหลดไม่สำเร็จ ❌ ' + JSON.stringify(data));
    }
  }

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

    let profileUrl = '';
    // เก็บรูปถ้ามี
    if (file) {
      profileUrl = await this.uploadToCloudinary(file);
    } else {
      alert('กรุณาแนบรูปโปรไฟล์ด้วยนะครับ 😊');
    }

    // คืนค่า userCredential + แนบ avatarUrl เพื่อให้ component ใช้ต่อได้
    return { user: cred.user, profileUrl };
  }

  // ✅ ฟังก์ชันบันทึกข้อมูลเพิ่มใน Firestore
  async saveUserToDB(userData: {
    uid: string;
    username: string;
    email: string;
    role?: string;
    profileUrl?: string | null;
    money?: number;
  }) {
    const userRef = doc(this.firestore, 'users', userData.uid);
    await setDoc(userRef, {
      uid: userData.uid,
      username: userData.username,
      email: userData.email,
      profileUrl: userData.profileUrl || '',
      role: userData.role || 'user',
      createdAt: new Date(),
      money: userData.money || 0,
    });

    await signOut(this.auth);
  }

  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = cred.user.uid;

    let snap = await getDoc(doc(this.firestore, 'users', uid));
    let role = 'user';

    if (!snap.exists()) {
      const adminDocRef = doc(this.firestore, 'admin', 'admin');
      const adminSnap = await getDoc(adminDocRef);

      if (adminSnap.exists()) {
        snap = adminSnap;
        role = 'admin';
      } else {
        throw new Error('ไม่พบบัญชีใน Firestore ❌');
      }
    }

    const data = snap.data() as any;

    const userData = {
      uid,
      username: data.username || cred.user.displayName || 'ผู้ใช้ใหม่',
      email: data.email || cred.user.email,
      profileUrl: data.profileUrl || null,
      role: data.role || role,
    };

    // ✅ เก็บใน localStorage
    localStorage.setItem('user', JSON.stringify(userData));

    if (userData.role === 'admin') {
      alert(`ยินดีต้อนรับผู้ดูแลระบบ ${userData.username} 🧑‍💻`);
      this.router.navigate(['/admin/home']);
    } else {
      alert(`ยินดีต้อนรับ ${userData.username} 🎮`);
      this.router.navigate(['/user/home']);
    }

    return userData;
  }
  getRole(): string | null {
    const user = this.currentUser();
    return user ? user.role : null;
  }

  // ดึงข้อมูล user จาก Firestore (ถ้าต้องอัปเดตล่าสุด)
  async fetchUser(uid: string) {
    const docRef = doc(this.firestore, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('User not found');
    return snap.data();
  }

  


  // ✅ อัปเดตข้อมูลผู้ใช้ใน Firestore
async updateUser(uid: string, data: any, incrementMoney?: number) {
  try {
    const userRef = doc(this.firestore, 'users', uid);

    // ✅ ถ้ามีการเพิ่ม/ลดยอดเงิน
    if (incrementMoney !== undefined) {
      await updateDoc(userRef, {
        ...data,
        money: increment(incrementMoney),  // <-- ใช้ increment() ปลอดภัยจาก race condition
      });
    } else {
      await updateDoc(userRef, data);
    }

    // ✅ อัปเดต session ใน localStorage/sessionStorage
    const user = this.getUserFromSession();
    if (user) {
      const updated = {
        ...user,
        ...data,
        ...(incrementMoney !== undefined
          ? { money: (user.money || 0) + incrementMoney }
          : {}),
      };
      sessionStorage.setItem('user', JSON.stringify(updated));
    }

    console.log('อัปเดตข้อมูลผู้ใช้สำเร็จ ✅');
  } catch (error) {
    console.error('อัปเดตข้อมูลผู้ใช้ล้มเหลว ❌', error);
    throw error;
  }
}
  // ✅ อัปโหลดรูปใหม่และอัปเดต Firestore + sessionStorage
  async updateProfilePicture(file: File): Promise<string> {
    const user = this.getUserFromSession();
    if (!user || !user.uid)
      throw new Error('ไม่พบข้อมูลผู้ใช้ใน sessionStorage');

    try {
      // 1️⃣ อัปโหลดขึ้น Cloudinary
      const newUrl = await this.uploadToCloudinary(file);

      // 2️⃣ อัปเดตใน Firestore
      const userRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userRef, { profileUrl: newUrl });

      // 3️⃣ อัปเดต localStorage
      const updatedUser = { ...user, profileUrl: newUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('✅ เปลี่ยนรูปโปรไฟล์สำเร็จ');
      return newUrl;
    } catch (error) {
      console.error('❌ เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ', error);
      throw error;
    }
  }


  async addTopupHistory(userId: string, amount: number, note: string = 'เติมเงินเข้าสู่ระบบสำเร็จ') {
  try {
    const historyRef = collection(this.firestore, 'history');

    await addDoc(historyRef, {
      userId,           // uid ของผู้ใช้
      type: 'topup',    // ระบุประเภทการทำรายการ
      amount,           // จำนวนเงิน (บวก)
      note,             // ข้อความเพิ่มเติม
      timestamp: serverTimestamp(), // เวลาอัตโนมัติ
    });

    console.log(`บันทึกประวัติเติมเงิน ${amount} บาท สำเร็จ ✅`);
  } catch (error) {
    console.error('บันทึกประวัติเติมเงินล้มเหลว ❌', error);
    throw error;
  }
}


  async logout() {
    try {
      await signOut(this.auth);
      console.log('✅ Firebase logout successful');
    } catch (e) {
      console.warn('Firebase logout failed', e);
    } finally {
      this.currentUser.set(null);
      localStorage.removeItem('user'); // ✅ ล้างแค่ตอน logout
      console.log('✅ Session cleared');
      this.router.navigate(['/login']);
    }
  }
}
