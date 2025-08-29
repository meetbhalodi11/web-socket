import { BehaviorSubject, Observable } from 'rxjs';
import {
    DropDownData,
    PictureSelectionService,
} from './picture-selection.service';

// Provides the machinery that talks between this app and the backend communication service
// holds the observable and the command response handler, as well as the Command from the
// server API and an initial value for subscriptions
export class CommandHandler<T extends any> {
    // tslint:disable-next-line:variable-name
    private _responseUpdate: BehaviorSubject<any> = new BehaviorSubject(null);
    public responseUpdates: Observable<T> = this._responseUpdate.asObservable();

    constructor(public command: string) {}

    public handleResponse(response: T) {
        this._responseUpdate.next(response);
    }
}

// Returns the appropriate command handler
export class CommandFactory {
    public static Create(command: string): CommandHandler<any> {
        switch (command) {
            case PictureSelectionService.GET_PICTURE_SELECTOR:
                return new CommandHandler<DropDownData>(command);
                break;
            default:
                console.warn(
                    'Requested command ' +
                        command +
                        ' not implemented yet in CommandFactory'
                );
                return null!;
        }
    }
}
