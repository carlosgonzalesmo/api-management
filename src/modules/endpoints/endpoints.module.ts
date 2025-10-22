import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endpoint } from './endpoint.entity';
import { EndpointsService } from './endpoints.service';
import { EndpointsController } from './endpoints.controller';
import { EndpointParameter } from './endpoint-parameter.entity';
import { EndpointParametersService } from './parameters.service';
import { EndpointParametersController } from './parameters.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Endpoint, EndpointParameter])],
  providers: [EndpointsService, EndpointParametersService],
  controllers: [EndpointsController, EndpointParametersController],
  exports: [EndpointsService, EndpointParametersService],
})
export class EndpointsModule {}