import { BadRequestException } from '@nestjs/common';
import { Ack, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import { CacheService, TokenService } from 'src/common/utils/service';
import { getAuthSocket } from 'src/common/utils/socket';
import type { HUserDocument } from 'src/model';
@WebSocketGateway( {cors: { origin: "*" }})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
    constructor(
        private readonly tokenService: TokenService,
        private readonly redisService: CacheService,
    ) { 
     
  }
    @WebSocketServer()
   private server!: Server // io

    afterInit(server: Server) {
        console.log("Gateway is running 🌸");
    }
    async handleConnection(client: Socket) {
        try {
            console.log(`Connected ${client.id}`);
            const { user, decoded } = await this.tokenService.decodeToken({ token: getAuthSocket(client) })
            client.data = { user, decoded }
            await this.redisService.addSocket(user._id, client.id)
            throw new BadRequestException("Fail")
        } catch (error: any) {
            client.emit("custom_error", error.message)
        }

    }

    async handleDisconnect(client: Socket) {
        try {
            console.log(`disconnected ${client.id}`);

            await this.redisService.removeSocket(client.data.user._id, client.id);
            const connections = await this.redisService.getSockets(client.data.user._id) || []
            if (connections.length < 1) {
                this.server.emit("offline_user", { userId: client.data.user._id })
            }
        } catch (error) {
            client.emit("custom_error", error)
        }

    }
    @Auth([RoleEnum.ADMIN])
    @SubscribeMessage("sayHi")
    sayH(
        @User() user: HUserDocument,
        @MessageBody() body: any,
        @Ack() ack: (response: { status: string; data: string }) => void,
        @ConnectedSocket() client: Socket
    ) {
        try {
            console.log({ body, client, user });
            ack({ status: 'received', data: "kjcedewi" });

            this.server.emit("sayHi", "LOLOL ")
        } catch (error) {
            client.emit("custom_error", error)
        }

    }

    changeStock(products: { productId: Types.ObjectId, stock: number }[]) {
        this.server.emit("stock", products)
}
}