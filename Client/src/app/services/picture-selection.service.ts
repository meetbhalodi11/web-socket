import { inject, Injectable } from '@angular/core';
import { Observable, take } from 'rxjs';
import { CommandHandler, CommandFactory } from './command-factory';
import { BackendCommunicationService } from './backend-communication.service';

export class DropDownOption {
    constructor(
        public index: number,
        public label: string,
        public value: string
    ) {}
}

export class DropDownData {
    constructor(
        public options: DropDownOption[],
        public selectedIndex: number,
        public disabled: boolean
    ) {}
}

@Injectable({
    providedIn: 'root',
})

// Manages any communication related to the picture selector
// Components should use this service to get/request their picture related data
// This is the layer between the backend-communication.service and the components
export class PictureSelectionService {
    public static GET_PICTURE_SELECTOR: string = 'pictures:getSelector';
    public static UPDATE_PICTURE: string = 'pictures:updatePicture';

    private commandCollection = new Map<string, CommandHandler<any>>();
    private backendCommunicationService = inject(BackendCommunicationService);

    // Observable version: Get the current picture selector data
    public getPictureSelector$(): Observable<DropDownData> {
        return new Observable<DropDownData>((observer) => {
            this.backendCommunicationService
                .sendCommand$(PictureSelectionService.GET_PICTURE_SELECTOR)
                .subscribe({
                    next: (data: DropDownData) => {
                        observer.next(data);
                        observer.complete();
                    },
                    error: (error: any) => {
                        observer.error(error);
                    },
                });
        });
    }

    // Observable version: Subscribe to updates for the picture selector
    public subscribeToPictureSelectorUpdates$(): Observable<DropDownData> {
        return this.subscribeToUpdates$(
            PictureSelectionService.GET_PICTURE_SELECTOR
        );
    }

    // Observable version: Request initial data and subscribe to updates
    public initializePictureSelector$(): Observable<DropDownData> {
        return new Observable<DropDownData>((observer) => {
            // Get initial data
            this.getPictureSelector$().subscribe({
                next: (data: DropDownData) => {
                    observer.next(data);
                },
                error: (error) => {
                    observer.error(error);
                },
            });

            // Subscribe to updates
            const updateSubscription =
                this.subscribeToPictureSelectorUpdates$().subscribe({
                    next: (data: DropDownData) => observer.next(data),
                    error: (error) => observer.error(error),
                });

            // Return cleanup function
            return () => {
                updateSubscription.unsubscribe();
            };
        });
    }

    public updateImageSingleTime() {
        this.backendCommunicationService
            .sendCommand$(PictureSelectionService.UPDATE_PICTURE)
            .pipe(take(1))
            .subscribe();
    }

    // Observable version: Subscribe to updates
    private subscribeToUpdates$(command: string): Observable<DropDownData> {
        let updatingCommand: CommandHandler<any> =
            this.commandCollection.get(command)!;
        // Lazy load
        if (updatingCommand == null) {
            updatingCommand = this.createCommand(command);
        }
        return updatingCommand.responseUpdates;
    }

    private createCommand(command: string): CommandHandler<any> {
        const newCommand: CommandHandler<any> = CommandFactory.Create(command)!;
        this.commandCollection.set(command, newCommand);

        // Subscribe to updates from the backend and forward them to the CommandHandler
        this.backendCommunicationService
            .registerUpdateHandler$(command)
            .subscribe({
                next: (data: any) => {
                    newCommand.handleResponse(data);
                },
                error: (error: any) => {
                    console.error('Error in createCommand:', error);
                },
            });

        return newCommand;
    }
}
