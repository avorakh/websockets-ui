import { httpServer } from "./dist/http_server/index.js";
import { ws_server } from "./dist/ws_server/index.js";

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

ws_server.on('listening', () => {
    const address = ws_server.address();
    console.log(`Start WS server on the ${address.port} port!`);
});
