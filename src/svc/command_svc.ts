import { Command, CommandResponse } from '../command/commands.js';
import { WebSocket } from 'ws';


export interface CommandHandler {
    canHandle(command: Command): boolean;
    handle(command: Command): Promise<CommandResponse | undefined>;
}

export interface CommandProcessingService {
    process(command: string, ws: WebSocket): Promise<void>;
}