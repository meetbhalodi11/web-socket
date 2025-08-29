import * as WebSocket from 'ws';
import { PicturesNamespace } from './pictures';

// class for holding the JSON-RPC command in a format that stringifies well
class JsonRpcCommand {
    public jsonrpc: string = '2.0';

    constructor(
        public method: string,
        public result: any = {},
        public id?: number,
        public error?: string
    ) {}
}

// Manages communication with the client, interpeting the commands
// Also sends random updates

export class ClientCommandProcessor {
    // time(ms) between random image updates
    private static readonly IMAGE_UPDATE_INTERVAL: number = 2000;
    private imageUpdateTimer: any;

    private socket: WebSocket;

    private pictureCommands: PicturesNamespace;

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.pictureCommands = new PicturesNamespace();

        // Set up the socket listener to receive commands,
        // massaging them down to a message we can use
        this.socket.on('message', (message: any) => {
            const parsedMessage: any = JSON.parse(message);
            if (
                parsedMessage != null &&
                parsedMessage.hasOwnProperty('jsonrpc') &&
                parsedMessage.jsonrpc === '2.0' &&
                parsedMessage.hasOwnProperty('id') &&
                parsedMessage.hasOwnProperty('method') &&
                parsedMessage.hasOwnProperty('params')
            ) {
                this.processClientMessage(
                    parsedMessage.id,
                    parsedMessage.method,
                    parsedMessage.params
                );
            } else {
                console.warn('Invalid message format: ', message);
            }
        });

        // Handle socket close
        this.socket.on('close', () => {
            this.stopUpdatingImage();
        });
    }

    public startImageUpdating() {
        this.imageUpdateTimer = setInterval(
            this.updateImage.bind(this),
            ClientCommandProcessor.IMAGE_UPDATE_INTERVAL
        );
    }

    public updateImpaceSingleTime() {
        this.updateImage();
    }

    public isImageUpdating(): boolean {
        return this.imageUpdateTimer != null;
    }

    public stopUpdatingImage() {
        if (this.imageUpdateTimer) {
            clearInterval(this.imageUpdateTimer);
            this.imageUpdateTimer = null;
        }
    }

    public updateImage() {
        this.pictureCommands.setPictureSelected(
            Math.floor(
                Math.random() *
                    this.pictureCommands.getPictureSelector().options.length
            )
        );

        this.pictureCommands.setPictureSelectorEnabled(Math.random() < 0.7);

        this.sendMessage(
            new JsonRpcCommand(
                PicturesNamespace.GET_PICTURE_SELECTOR,
                this.pictureCommands.getPictureSelector()
            )
        );
    }

    private processClientMessage(id: number, method: string, params: any) {
        switch (method) {
            case PicturesNamespace.GET_PICTURE_SELECTOR:
                this.sendMessage(
                    new JsonRpcCommand(
                        method,
                        this.pictureCommands.getPictureSelector(),
                        id
                    )
                );
                // if (!this.isImageUpdating()) {
                //     this.startImageUpdating();
                // }
                this.updateImpaceSingleTime();
                break;
            case PicturesNamespace.UPDATE_PICTURE:
                this.sendMessage(
                    new JsonRpcCommand(
                        method,
                        this.pictureCommands.getPictureSelector(),
                        id
                    )
                );
                this.updateImpaceSingleTime();
                break;
            default:
                this.sendMessage(
                    new JsonRpcCommand(
                        method,
                        undefined,
                        id,
                        'Cannot process unknown method ' + method
                    )
                );
        }
    }

    private sendMessage(message: JsonRpcCommand) {
        if (this.socket.readyState === this.socket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
}
