import { CommandProcessingService, CommandHandler } from '../svc/command_svc.js';
import { DefaultCommandProcessingService } from '../svc/command_svc_impl.js';
import { CommandParser, DefaultCommandParser } from '../parser/command_parser.js';
import { PlayerCommandHandler } from "../svc/player_command_handler.js";
import { UserService, DefaultUserService } from '../svc/user_svc.js';

const cmdParser: CommandParser = new DefaultCommandParser();

const userService: UserService = new DefaultUserService();
const playerCommandHandler: CommandHandler = new PlayerCommandHandler(userService);

export const commandProcessingSvc: CommandProcessingService = new DefaultCommandProcessingService(cmdParser, [playerCommandHandler]);