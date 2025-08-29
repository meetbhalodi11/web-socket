import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { ClientCommandProcessor } from './command-processor';

// Sets up the listener on port 3000 and passes each new client connection
// to a ClientCommandProcessor to manage

class MainServer {
    private clientCommandProcessors: ClientCommandProcessor[];

    constructor() {
        this.clientCommandProcessors = [];
        this.initSocketConnection();
    }

    private initClientListener(socket: WebSocket) {
        // Clean up old client connections
        this.clientCommandProcessors = this.clientCommandProcessors.filter(
            (processor) => processor.isImageUpdating()
        );

        // create a new command processor to handle the new client connection
        const processor = new ClientCommandProcessor(socket);
        this.clientCommandProcessors.push(processor);

        // Handle socket close to clean up
        socket.on('close', () => {
            this.clientCommandProcessors = this.clientCommandProcessors.filter(
                (p) => p !== processor
            );
        });

        console.log(
            `New client connected. Total clients: ${this.clientCommandProcessors.length}`
        );
    }

    private initSocketConnection() {
        // set up socket.io and bind it to our http server.
        const app = express();

        //initialize a simple http server
        const server = http.createServer(app);

        //initialize the WebSocket server instance
        const wss = new WebSocket.Server({ server });

        wss.on('connection', this.initClientListener.bind(this));

        // Handle WebSocket server errors
        wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });

        // start listening on port 3000
        server.listen(3000, function () {
            console.log('Server listening on *:3000');
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('HTTP server error:', error);
        });
    }
}

const mainServer = new MainServer();
