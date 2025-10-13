import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, increment, limit, serverTimestamp, updateDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class GameService {
  discountService: any;
  constructor(private firestore: Firestore) {}

  async updateUserMoney(userId: string, newMoney: number) {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, { money: newMoney });
  }

  async addMyGame(userId: string, game: any) {
    const mygameRef = collection(this.firestore, 'mygames');
    await addDoc(mygameRef, {
      userId,
      gameId: game.id,
      name: game.name,
      imageUrl: game.imageUrl,
      price: game.price,
      purchasedAt: serverTimestamp(),
    });
  }

  //ลบคูปองเมื่อใช้
  async decreaseCouponCount(discountId: string) {
  const ref = doc(this.firestore, 'discounts', discountId);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const data = snapshot.data();
    const currentLimit = data['limit'] || 1;
    const newLimit = Math.max(currentLimit - 1, 0);

    // ถ้า newLimit == 0 ให้เปลี่ยน status เป็น "inactive"
    const newStatus = newLimit === 0 ? 'inactive' : data['status'] || 'active';

    await updateDoc(ref, {
      limit: newLimit,
      status: newStatus
    });
  }
}


//นับเกมว่าขายได้เท่าไหร่
async increaseSoldCount(gameId: string) {
    try {
      const gameRef = doc(this.firestore, 'games', gameId);
      await updateDoc(gameRef, { sold: increment(1) });
      console.log(`📈 อัปเดตยอดขายเกม ${gameId} สำเร็จ`);
    } catch (err) {
      console.error(`❌ เพิ่มยอดขายเกม ${gameId} ไม่สำเร็จ`, err);
      throw err;
    }
  }


}
