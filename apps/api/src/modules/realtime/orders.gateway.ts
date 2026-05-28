import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/orders', cors: { origin: '*' } })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const branchId = client.handshake.query.branchId as string | undefined;
    if (branchId) {
      client.join(`branch:${branchId}`);
      this.logger.debug(`Client joined branch:${branchId}`);
    }
  }

  handleDisconnect() {}

  emitOrderUpdated(branchId: string, payload: unknown) {
    this.server?.to(`branch:${branchId}`).emit('order.updated', payload);
  }

  emitOrderCreated(branchId: string, payload: unknown) {
    this.server?.to(`branch:${branchId}`).emit('order.created', payload);
  }
}
