import { Player } from '../svc/user_svc.js';
import { v4 as uuidv4 } from "uuid";
export interface Room {
    roomId: string,
    roomUsers: Player[]
}

export interface RoomService {
    getAllRooms(): Promise<Room[]>;
    getSingleUserRooms(): Promise<Room[]>;
    addRoom(player: Player): Promise<Room>;
    updateRoom(id: string, player: Player): Promise<Room | undefined>;
}

export class DefaultRoomService implements RoomService {


    private roomMap = new Map<string, Room>();

    async getAllRooms(): Promise<Room[]> {

        let foundRooms: Room[] = Array.from(this.roomMap.values());
        return foundRooms;
    }

    async getSingleUserRooms(): Promise<Room[]> {
        let allRooms: Room[] = await this.getAllRooms();
        return allRooms.filter(room => room.roomUsers.length === 1);
    }

    async addRoom(player: Player): Promise<Room> {
        let allRooms: Room[] = await this.getAllRooms();
        let foundFreeRoom = allRooms.find(room => room.roomUsers.length === 0);
        if (foundFreeRoom) {
            foundFreeRoom.roomUsers.push(player);

            this.roomMap.set(foundFreeRoom.roomId, foundFreeRoom);

            return foundFreeRoom;
        } else {
            let id: string = uuidv4();

            let newRoom: Room = {
                roomId: id,
                roomUsers: [player]
            }

            this.roomMap.set(id, newRoom)
            return newRoom;
        }
    }

    async updateRoom(id: string, player: Player): Promise<Room | undefined> {
        let foundRoom = this.roomMap.get(id);

        if (foundRoom && foundRoom.roomUsers.length === 1) {
            let firstPlayer = foundRoom.roomUsers[0];
            if (firstPlayer.index === player.index && firstPlayer.name === player.name ) {
                console.error(`Unable to update room with Id  with the same user - [${id}]`);
                return;
            } 
            foundRoom.roomUsers.push(player)

            this.roomMap.set(foundRoom.roomId, foundRoom);

            return foundRoom;
        } else {
            console.error(`Unable to update room with Id - [${id}]`);
        }
    }
}