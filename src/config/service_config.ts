import { CommandProcessingService, CommandHandler } from '../svc/command_svc.js';
import { DefaultCommandProcessingService } from '../svc/command_svc_impl.js';
import { CommandParser, DefaultCommandParser } from '../parser/command_parser.js';
import { PlayerCommandHandler } from "../svc/player_command_handler.js";
import { UserService, DefaultUserService } from '../svc/user_svc.js';
import { RoomService, DefaultRoomService } from '../svc/room_svc.js';
import { PlayerClientService, SimplePlayerClientService } from '../svc/ws_client_svc.js';
import { AddRoomCommandHandler } from '../svc/room_handler.js';

export const plClientSvc: PlayerClientService = new SimplePlayerClientService();

const cmdParser: CommandParser = new DefaultCommandParser();

const userService: UserService = new DefaultUserService();
const roomService: RoomService = new DefaultRoomService();
const playerCommandHandler: CommandHandler = new PlayerCommandHandler(userService, roomService, plClientSvc);
const addRoomCommandHandler: CommandHandler = new AddRoomCommandHandler(roomService, plClientSvc);
const handlers: CommandHandler[] = [playerCommandHandler, addRoomCommandHandler]
export const commandProcessingSvc: CommandProcessingService = new DefaultCommandProcessingService(cmdParser, handlers);