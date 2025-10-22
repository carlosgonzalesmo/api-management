import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Execution } from './execution.entity';
import { ExecutionsService } from './executions.service';
import { ExecutionsController } from './executions.controller';
import { Endpoint } from '../endpoints/endpoint.entity';
import { EndpointParameter } from '../endpoints/endpoint-parameter.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        TypeOrmModule.forFeature([Execution, Endpoint, EndpointParameter]),
    ],
    providers: [ExecutionsService],
    controllers: [ExecutionsController],
    exports: [ExecutionsService],
})
export class ExecutionsModule { }