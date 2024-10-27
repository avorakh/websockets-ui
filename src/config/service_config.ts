import { CommandProcessingService, CommandHandler } from '../svc/command_svc.js';
import { DefaultCommandProcessingService } from '../svc/command_svc_impl.js';
import { CommandParser, DefaultCommandParser } from '../parser/command_parser.js';
import { PlayerCommandHandler } from "../svc/player_command_handler.js";
import { UserService, DefaultUserService } from '../svc/user_svc.js';
import { RoomService, DefaultRoomService } from '../svc/room_svc.js';
import { PlayerClientService, SimplePlayerClientService } from '../svc/ws_client_svc.js';
import { AddRoomCommandHandler, AddUserToRoomCommandHandler } from '../svc/room_handler.js';
import { WebSocketEventSender, SimpleWebSocketEventSender } from '../svc/event_sender.js';
import { WinnerService, SimpleWinnerService } from '../svc/winner_svc.js';
import { GameService, SimpleGameService } from '../svc/geme_svc.js';

export const plClientSvc: PlayerClientService = new SimplePlayerClientService();

const cmdParser: CommandParser = new DefaultCommandParser();

const userService: UserService = new DefaultUserService();
const roomService: RoomService = new DefaultRoomService();
const winnerService: WinnerService = new SimpleWinnerService()

const eventSender: WebSocketEventSender = new SimpleWebSocketEventSender(roomService, plClientSvc, winnerService)

const gameService: GameService = new SimpleGameService(eventSender);

const playerCommandHandler: CommandHandler = new PlayerCommandHandler(userService, plClientSvc, winnerService, eventSender);
const addRoomCommandHandler: CommandHandler = new AddRoomCommandHandler(roomService, plClientSvc, eventSender);
const addUserToRoomCommandHandler: CommandHandler = new AddUserToRoomCommandHandler(roomService, plClientSvc, eventSender, gameService);


const handlers: CommandHandler[] = [playerCommandHandler, addRoomCommandHandler, addUserToRoomCommandHandler]

export const commandProcessingSvc: CommandProcessingService = new DefaultCommandProcessingService(cmdParser, handlers);