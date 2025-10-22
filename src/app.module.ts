import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endpoint } from './modules/endpoints/endpoint.entity';
import { EndpointsModule } from './modules/endpoints/endpoints.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppAuthProvider } from './app.guard';
import { ExecutionsModule } from './modules/executions/executions.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SchedulerInfraModule } from './modules/scheduler/scheduler.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('databaseUrl'),
        autoLoadEntities: true,
        synchronize: false,
        logging: true,
      }),
    }),
    AuthModule,
    EndpointsModule,
    ExecutionsModule,
    SchedulesModule,
    SchedulerInfraModule,
  ],
  controllers: [],
  providers: [AppAuthProvider],
})
export class AppModule {}