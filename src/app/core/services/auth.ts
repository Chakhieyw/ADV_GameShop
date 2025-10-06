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
  getFirestore,
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
  router: any;

  constructor(private auth: Auth, private firestore: Firestore ,private router: Router) {
    // ✅ ฟังการเปลี่ยนแปลงสถานะจาก Firebase โดยตรง
    onAuthStateChanged(this.auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(
            doc(this.firestore, 'users', firebaseUser.uid)
          );
          if (snap.exists()) {
            const userData = { uid: firebaseUser.uid, ...snap.data() };
            this.currentUser.set(userData);
            // ✅ เปลี่ยนเป็น sessionStorage
            sessionStorage.setItem('user', JSON.stringify(userData));
            console.log('Auth state changed: User logged in', userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          this.currentUser.set(null);
          sessionStorage.removeItem('user'); // ✅ ลบ session ด้วย
        }
      } else {
        this.currentUser.set(null);
        sessionStorage.removeItem('user'); // ✅ ลบ session ด้วย
      }
      this.authChecked.set(true);
    });
  }

  // ✅ เปลี่ยนเป็น sessionStorage
  getUserFromSession() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // ✅ ตรวจสอบการล็อกอินจาก session
  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('user');
  }

  // ✅ ฟังก์ชันรอให้ auth state พร้อม
  async waitForAuthCheck(): Promise<boolean> {
    // ถ้ายังไม่เช็ค auth state ให้รอ
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
  }) {
    const userRef = doc(this.firestore, 'users', userData.uid);
    await setDoc(userRef, {
      uid: userData.uid,
      username: userData.username,
      email: userData.email,
      profileUrl: userData.profileUrl || '',
      role: userData.role || 'user',
      createdAt: new Date(),
    });

    await signOut(this.auth);
  }

  
  async login(email: string, password: string) {
    // 🔹 เข้าสู่ระบบด้วย Firebase Authentication
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = cred.user.uid;

    // 🔹 พยายามดึงข้อมูลจาก collection "users" ก่อน
    let snap = await getDoc(doc(this.firestore, 'users', uid));

    // 🔹 ถ้าไม่เจอใน users ให้ลองใน admin
    let roleSource = 'users';
    if (!snap.exists()) {
      snap = await getDoc(doc(this.firestore, 'admin', 'admin')); // สมมติเอกสารชื่อ "admin"
      roleSource = 'admin';
    }

    if (!snap.exists()) {
      throw new Error('ไม่พบบัญชีใน Firestore ❌');
    }

    const data = snap.data() as any;

    // 🔹 กำหนดข้อมูลผู้ใช้
    const userData = {
      uid,
      username: data.username || cred.user.displayName || 'ผู้ใช้ใหม่',
      email: data.email || cred.user.email,
      profileUrl: data.profileUrl || null,
      role: data.role || (roleSource === 'admin' ? 'admin' : 'user'),
    };

    // 🔹 เก็บข้อมูลผู้ใช้
    this.currentUser.set(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));

    // 🔹 ส่งไปหน้า Home ตาม role
    if (userData.role === 'admin') {
      this.router.navigate(['/admin/home']);
    } else {
      this.router.navigate(['/user/home']);
    }

    return userData;
  }

  // ดึงข้อมูล user จาก Firestore (ถ้าต้องอัปเดตล่าสุด)
  async fetchUser(uid: string) {
    const docRef = doc(this.firestore, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('User not found');
    return snap.data();
  }

  // ✅ อัปเดตข้อมูลผู้ใช้ใน Firestore
  async updateUser(uid: string, data: any) {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      await updateDoc(userRef, data);

      // อัปเดต localStorage ด้วย
      const user = this.getUserFromSession();
      if (user) {
        const updated = { ...user, ...data };
        sessionStorage.setItem('user', JSON.stringify(updated));
      }

      console.log('อัปเดตข้อมูลผู้ใช้สำเร็จ ✅');
    } catch (error) {
      console.error('อัปเดตข้อมูลผู้ใช้ล้มเหลว ❌', error);
      throw error;
    }
  }

  // ใน AuthService
// ✅ เพิ่ม method ตรวจสอบ userType
getUserType(): string {
  const user = this.getUserFromSession();
  return user?.userType || 'user'; // default เป็น 'user'
}

// ✅ ตรวจสอบว่าเป็น admin หรือไม่
isAdmin(): boolean {
  return this.getUserType() === 'admin';
}

// ✅ ตรวจสอบว่าเป็น user หรือไม่
isUser(): boolean {
  return this.getUserType() === 'user';
}

// ✅ ตรวจสอบและ redirect ตาม role
checkRoleAccess(): boolean {
  const userType = this.getUserType();
  const currentPath = window.location.pathname;
  
  // ถ้าเป็น user แต่พยายามเข้า admin route
  if (userType === 'user' && currentPath.includes('/admin')) {
    this.router.navigate(['/user/home']);
    return false;
  }
  
  // ถ้าเป็น admin แต่พยายามเข้า user route (optional)
  if (userType === 'admin' && currentPath.includes('/user')) {
    this.router.navigate(['/admin/dashboard']);
    return false;
  }
  
  return true;
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

  async logout() {
    try {
      // ✅ ต้องล็อกเอาท์จาก Firebase ก่อน
      await signOut(this.auth);
      console.log('✅ Firebase logout successful');
    } catch (e) {
      console.warn('Firebase logout failed', e);
    } finally {
      // ✅ ล้าง state ทุกอย่าง
      this.currentUser.set(null);
      sessionStorage.removeItem('user');
      localStorage.removeItem('user'); // ลบด้วยเพื่อความชัวร์

      console.log('✅ Local state cleared');
    }
  }
}
