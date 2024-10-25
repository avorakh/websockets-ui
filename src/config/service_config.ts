import { CommandProcessingService, CommandHandler } from '../svc/command_svc.js';
import { DefaultCommandProcessingService } from '../svc/command_svc_impl.js';
import { CommandParser, DefaultCommandParser } from '../parser/command_parser.js';
import { PlayerCommandHandler } from "../svc/player_command_handler.js";

const cmdParser: CommandParser = new DefaultCommandParser();

const playerCommandHandler: CommandHandler = new PlayerCommandHandler()

export const commandProcessingSvc: CommandProcessingService = new DefaultCommandProcessingService(cmdParser, [playerCommandHandler]);