import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { EndpointParametersService } from './parameters.service';
import { CreateParameterDto } from './dto/create-parameter.dto';

@Controller()
export class EndpointParametersController {
  constructor(private readonly paramsService: EndpointParametersService) {}

  @Post('endpoints/:endpointId/parameters')
  create(
    @Param('endpointId') endpointId: string,
    @Body() dto: CreateParameterDto,
  ) {
    return this.paramsService.create(endpointId, dto);
  }

  @Get('endpoints/:endpointId/parameters')
  list(@Param('endpointId') endpointId: string) {
    return this.paramsService.listByEndpoint(endpointId);
  }

  @Delete('parameters/:paramId')
  remove(@Param('paramId') paramId: string) {
    return this.paramsService.delete(paramId);
  }
}