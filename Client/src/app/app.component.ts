import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import {
    DropDownData,
    PictureSelectionService,
} from './services/picture-selection.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [NgIf, NgFor, MatSelectModule, MatCardModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
    public picData = signal<DropDownData | null>(null);
    private subscription: Subscription | null = null;

    public selectedImagePath = signal<string>('');
    public selectedImageLabel = signal<string>('');

    private pictureSelectionService = inject(PictureSelectionService);

    ngOnInit() {
        this.subscription = this.pictureSelectionService
            .initializePictureSelector$()
            .subscribe({
                next: (data: DropDownData) => {
                    this.picData.set(data);
                    this.selectedImagePath.set(
                        `assets/${
                            this.picData()?.options[
                                this.picData()?.selectedIndex ?? 0
                            ]?.value ?? ''
                        }`
                    );
                    this.selectedImageLabel.set(
                        this.picData()?.options[
                            this.picData()?.selectedIndex ?? 0
                        ]?.label ?? ''
                    );
                },
            });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
