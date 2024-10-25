import { Command } from '../command/commands.js';

export interface CommandParser {
    parse(msg: string): Command;
}

export class DefaultCommandParser implements CommandParser {
    parse(msg: string): Command {
        const parsedCommand: Command = JSON.parse(msg);
        return parsedCommand;
    }
}