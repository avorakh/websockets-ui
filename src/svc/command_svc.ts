import { Command } from '../command/commands.js';
import { WebSocket } from 'ws';


export interface CommandHandler {
    canHandle(command: Command): boolean;
    handle(command: Command, ws: WebSocket, clientId: string): Promise<void>;
}

export interface CommandProcessingService {
    process(command: string, ws: WebSocket, clientId: string): Promise<void>;
}