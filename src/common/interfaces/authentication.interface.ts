import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { HUserDocument } from "src/model";
import { Socket } from 'socket.io';

export interface IAuthReq extends Request {
    credentials: { user: HUserDocument, decoded: JwtPayload }
}
export interface IAuthSocket extends Socket {
    credentials: { user: HUserDocument, decoded: JwtPayload }
}
export type CxtType = 'http' | 'graphql' | 'ws' | 'rpc'  ;
