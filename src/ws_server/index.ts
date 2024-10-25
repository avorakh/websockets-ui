import { WebSocket, WebSocketServer } from 'ws';
import { commandProcessingSvc } from '../config/service_config.js';

const PORT = 3000;

const ws_server = new WebSocketServer({ port: Number(PORT) });

ws_server.on('connection', async (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', async (command: string) => {
        commandProcessingSvc.process(command, ws)
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