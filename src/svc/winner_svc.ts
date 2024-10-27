export interface PlayerWinnerResult {
    name: string,
    wins: number
}

export interface WinnerService {
    getAllWinners(): Promise<PlayerWinnerResult[]>;
    addPlayer(name: string): Promise<void>;
}

export class SimpleWinnerService implements WinnerService {

    private winnerMap = new Map<string, number>();

    async getAllWinners(): Promise<PlayerWinnerResult[]> {

        const winnersArray: PlayerWinnerResult[] = Array.from(this.winnerMap.entries()).map(([name, wins]) => ({
            name,
            wins
        }));
        return winnersArray;
    }

    async addPlayer(name: string): Promise<void> {
        this.winnerMap.set(name, 0);
    }
}