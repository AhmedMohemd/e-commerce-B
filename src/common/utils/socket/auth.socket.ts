import { Socket } from "socket.io";


export const getAuthSocket = (client: Socket) => {
    return client.handshake.auth.authorization || client.handshake.headers.authorization
}