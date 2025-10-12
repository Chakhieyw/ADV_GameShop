import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, limit, serverTimestamp, updateDoc } from '@angular/fire/firestore';

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

  async decreaseCouponCount(discountId: string) {
  const ref = doc(this.firestore, 'discounts', discountId);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    const data = snapshot.data();
    const count = (data['limit'] || 1) - 1;
    await updateDoc(ref, { limit: Math.max(count, 0) });
  }
}


}
