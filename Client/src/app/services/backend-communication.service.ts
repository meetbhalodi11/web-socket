import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// This service is intended to be used by other services, not
// directly by components; create other services that provide
// access to the backend API for components and have those services
// use this layer to actually perform the communication

// callback to match up explicit client calls with their backend response
export type ResponseProcessor = (response: any) => void;

// callbacks that accept push notifications from the backend
// params: { paramName1: paramValue1, paramName2: paramValue2, ... }
export type UpdateProcessor = (params: any) => void;

// class for holding the JSON-RPC command in a format that stringifies well
class JsonRpcCommand {
    public jsonrpc: string = '2.0';

    constructor(
        public id: number,
        public method: string,
        public params: any = {}
    ) {}
}

@Injectable({
    providedIn: 'root',
})

// Actually manages talking over the socket with the backend
// Keeps collections of callbacks to match responses with client
// calls/subscriptions, so data gets where it was intended
export class BackendCommunicationService {
    private socket: WebSocket;

    private messageID: number;

    // matches up responses with the message that made the request
    private responseCallbacks: Map<number, ResponseProcessor>;

    private commandCallback: Map<string, UpdateProcessor>;

    private commandCache = new Map<string, Subject<any>>();

    constructor() {
        this.commandCallback = new Map<string, UpdateProcessor>();
        this.responseCallbacks = new Map<number, ResponseProcessor>();
        this.messageID = 0;
        this.initSocketConnection();
    }

    public initSocketConnection() {
        this.socket = new WebSocket('ws://localhost:3000');
        this.socket.onmessage = this.processServerMessage.bind(this);
    }

    public registerUpdateHandler$(command: string): Observable<any> {
        let subject = this.commandCache.get(command);
        if (!subject) {
            subject = new Subject<any>();
            this.commandCache.set(command, subject);
        }
        return subject.asObservable();
    }

    public sendCommand$(method: string, params?: any): Observable<any> {
        return new Observable((observer) => {
            if (
                this.socket.readyState === this.socket.CLOSED ||
                this.socket.readyState === this.socket.CLOSING
            ) {
                observer.error('Websocket no longer available');
                return;
            }

            if (method == null || method.length < 1) {
                observer.error('Method (command name) is required!');
                return;
            }

            const messageID: number = this.messageID++;
            const queryString = JSON.stringify(
                new JsonRpcCommand(messageID, method, params)
            );

            if (this.socket.readyState === this.socket.CONNECTING) {
                setTimeout(() => {
                    if (this.socket.readyState === this.socket.OPEN) {
                        this.socket.send(queryString);
                        observer.next(
                            'Update picture command sent successfully'
                        );
                        observer.complete();
                    } else {
                        observer.error('Websocket connection failed');
                    }
                }, 400);
            } else {
                this.socket.send(queryString);
                observer.next('Update picture command sent successfully');
                observer.complete();
            }
        });
    }

    // handle a message the has come in from the backend
    private processServerMessage(event: MessageEvent) {
        // Extract the message
        const message: any = JSON.parse(event.data);
        if (message != null && message.hasOwnProperty('method')) {
            // Response to a request we made to the backend
            if (message.hasOwnProperty('id') && message.id != null) {
                const callback: ResponseProcessor = this.responseCallbacks.get(
                    message.id
                )!;
                if (callback != null) {
                    callback(message.result);
                }
                this.responseCallbacks.delete(message.id);
            } else {
                const callback: UpdateProcessor = this.commandCallback.get(
                    message.method
                )!;
                if (callback != null) {
                    callback(message.result);
                }
                // Emit to update subject
                const updateSubject = this.commandCache.get(message.method);
                if (updateSubject) {
                    updateSubject.next(message.result);
                }
            }
        }
    }
}
