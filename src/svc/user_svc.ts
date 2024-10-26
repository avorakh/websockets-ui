import { v4 as uuidv4 } from "uuid";
import { UserLogin } from './player_command_handler.js';

export interface Player {
    index: string,
    name: string
}

export interface UserService {
    loginOrCreate(userLogin: UserLogin): Promise<Player | undefined>;
}

export class DefaultUserService implements UserService {

    private playerCredentialsMap = new Map<string, string>();
    private playerMap = new Map<string, Player>();

    async loginOrCreate(userLogin: UserLogin): Promise<Player | undefined> {

        let playerName = userLogin.name

        let foundPassword = this.playerCredentialsMap.get(playerName);
        if (foundPassword && foundPassword === userLogin.password) {
            return this.playerMap.get(playerName);
        }
        else if (!foundPassword) {
            let userIndex = uuidv4()
            let newPlayer: Player = {
                index: userIndex,
                name: playerName
            }
            this.playerCredentialsMap.set(playerName, userLogin.password);
            this.playerMap.set(playerName, newPlayer);
            return newPlayer;
        }
    }

}