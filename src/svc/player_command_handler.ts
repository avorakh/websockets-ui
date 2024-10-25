import { Command, CommandResponse } from '../command/commands.js';
import { CommandHandler } from './command_svc.js';

interface UserLogin {
    name: string;
    password: string;
}

const toUserLogin = (msg: string): UserLogin => {
    let userLogin = JSON.parse(msg);
    return userLogin;
}


export class PlayerCommandHandler implements CommandHandler {

    canHandle(command: Command): boolean {
        return command.type === 'reg'
    }

    async handle(command: Command): Promise<CommandResponse | undefined> {

        let userLogin = toUserLogin(command.data);

        let userResponse = JSON.stringify({
            name: userLogin.name,
            index: "test_index",
        });

        let result: CommandResponse = {
            type: command.type,
            data: userResponse,
            id: command.id
        }

        return result;
    }

}