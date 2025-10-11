import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink,RouterModule } from '@angular/router';
import { Firestore, collection, getDocs, deleteDoc, doc } from '@angular/fire/firestore';


@Component({
  selector: 'app-manage-game',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './manage-game.html',
  styleUrls: ['./manage-game.scss'],
})
export class ManageGame {
  games = signal<any[]>([]);
  isLoading = signal(false);

  constructor(private firestore: Firestore, private router: Router) {}

  async ngOnInit() {
    await this.loadGames();
  }

  async loadGames() {
    this.isLoading.set(true);
    const querySnapshot = await getDocs(collection(this.firestore, 'games'));
    const list: any[] = [];
    querySnapshot.forEach((snap) => list.push({ id: snap.id, ...snap.data() }));
    this.games.set(list);
    this.isLoading.set(false);
  }

  async deleteGame(id: string) {
    if (!confirm('ต้องการลบเกมนี้หรือไม่?')) return;
    await deleteDoc(doc(this.firestore, 'games', id));
    alert('ลบเกมสำเร็จ ✅');
    await this.loadGames();
  }

  goToAdd() {
    this.router.navigate(['/admin/add-game']);
  }
  logout() {
    this.router.navigate(['/login']);
  }
  
}
