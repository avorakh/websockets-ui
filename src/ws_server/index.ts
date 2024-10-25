import { WebSocket, WebSocketServer } from 'ws';

const PORT = 3000;

const ws_server = new WebSocketServer({ port: Number(PORT) });

ws_server.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (command: string) => {
        console.log(`Received command: ${command}`);
        const result = command;
        console.log(`Result: ${result}`);
        ws.send(result);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error(`WebSocketServer error: ${error}`);
    });
});

process.on('SIGINT', () => {
    console.log('Shutting down WS server...');
    ws_server.close(() => {
        console.log('WS server closed');
        process.exit(0);
    });
});

export { ws_server }