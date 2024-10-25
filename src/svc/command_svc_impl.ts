import { WebSocket } from 'ws';
import { Command } from '../command/commands.js';
import { CommandProcessingService, CommandHandler } from './command_svc.js';
import { CommandParser } from '../parser/command_parser.js'

export class DefaultCommandProcessingService implements CommandProcessingService {

    private commandParser: CommandParser;
    private handlers: CommandHandler[]

    constructor(commandParser: CommandParser, handlers: CommandHandler[]) {
        this.commandParser = commandParser;
        this.handlers = handlers;
    }

    async process(command: string, ws: WebSocket): Promise<void> {

        console.log(`Received command: ${command}`);
        let cmd: Command = this.commandParser.parse(command)

        let firstHandler: CommandHandler | undefined = this.handlers
            .find((handler) => handler.canHandle(cmd));

        if (firstHandler) {
            let result = await firstHandler.handle(cmd)

            if (result) {
                let msg: string = JSON.stringify(result)
                console.log(`Result: ${msg}`);
                ws.send(msg);
            } else {
                console.log("No results");
            }

        } else {
            console.error(`Command handler not found for the command - [${command}]`);
        }
    }

}