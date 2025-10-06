import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageGame } from './manage-game';

describe('ManageGame', () => {
  let component: ManageGame;
  let fixture: ComponentFixture<ManageGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageGame]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
