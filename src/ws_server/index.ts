import { WebSocket, WebSocketServer } from 'ws';

const PORT = 3000;

const ws_server = new WebSocketServer({ port: Number(PORT) });

ws_server.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (message: string) => {
        console.log(`Received message: ${message}`);
        //TBA message handling
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error(`WebSocketServer error: ${error}`);
    });
});

export { ws_server }