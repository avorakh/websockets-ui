import { WebSocket, WebSocketServer } from 'ws';
import { commandProcessingSvc, plClientSvc } from '../config/service_config.js';
import { v4 as uuidv4 } from "uuid";

const PORT = 3000;

const ws_server = new WebSocketServer({ port: Number(PORT) });

ws_server.on('connection', async (ws: WebSocket) => {

    let clientId = uuidv4();

    plClientSvc.add(clientId, ws);

    console.log(`Client with id [${clientId}] connected`);

    ws.on('message', async (command: string) => {
        commandProcessingSvc.process(command, ws, clientId);
    });

    ws.on('close', () => {
        plClientSvc.delete(clientId);
        console.log(`Client with id [${clientId}] disconnected`);
    });

    ws.on('error', (error) => {
        console.error(`WebSocketServer error: ${error}`);
    });
});

process.on('SIGINT', () => {
    console.log('Shutting down WS server...');

    plClientSvc.clearAll();

    ws_server.close(() => {
        console.log('WS server closed');
        process.exit(0);
    });
});
export { ws_server }