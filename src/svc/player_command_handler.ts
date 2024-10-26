import { Command, CommandResponse } from '../command/commands.js';
import { CommandHandler } from './command_svc.js';
import { UserService } from './user_svc.js';

export interface UserLogin {
    name: string;
    password: string;
}

const toUserLogin = (msg: string): UserLogin => {
    let userLogin = JSON.parse(msg);
    return userLogin;
}


export class PlayerCommandHandler implements CommandHandler {

    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService
    }

    canHandle(command: Command): boolean {
        return command.type === 'reg'
    }

    async handle(command: Command): Promise<CommandResponse | undefined> {

        let userLogin = toUserLogin(command.data);

        let foundPlayer = await this.userService.loginOrCreate(userLogin);
        let responseData: string;
        if (foundPlayer) {
            responseData = JSON.stringify(foundPlayer);
        } else {
            responseData = JSON.stringify({
                error: true,
                errorText: "User not found or Invalid credentials",
            });
        }

        let result: CommandResponse = {
            type: command.type,
            data: responseData,
            id: command.id
        }

        return result;
    }

}