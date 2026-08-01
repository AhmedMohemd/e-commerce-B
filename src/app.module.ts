import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { BrandModule } from './modules/brand/brand.module';
import { OrderModule } from './modules/order/order.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SharedAuthentcationModule } from './common/module';
import { S3Service } from './common/utils/service';
import { CacheModule } from '@nestjs/cache-manager';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { CartModule } from './modules/cart/cart.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.production'],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => console.log('DB connected successfully👍'));
          connection.on('open', () => console.log('DB connection opened😍'));
          connection.on('disconnected', () => console.log('DB disconnected'));
          connection.on('reconnected', () => console.log('DB reconnected'));
          connection.on('disconnecting', () => console.log('DB disconnecting'));

          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    // MongooseModule.forRoot(process.env.DB_URI as string, {
    //   serverSelectionTimeoutMS: 30000,
    //   onConnectionCreate: (connection: Connection) => {
    //     connection.on('connected', () => console.log('DB connected successfully'));
    //     connection.on('open', () => console.log('open'));
    //     connection.on('disconnected', () => console.log('disconnected'));
    //     connection.on('reconnected', () => console.log('reconnected'));
    //     connection.on('disconnecting', () => console.log('disconnecting'));

    //     return connection;
    //   },
    // }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), `src/schema.gql`),
      graphiql: true

    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 10000
    }),
    SharedAuthentcationModule,
    AuthenticationModule,
    UserModule,
    ProductModule,
    CategoryModule,
    BrandModule,
    OrderModule,
    CartModule,
    CouponModule,
    OrderModule,
    RealtimeModule
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule { }
