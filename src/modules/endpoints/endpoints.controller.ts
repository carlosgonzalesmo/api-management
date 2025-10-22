import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { EndpointsService } from './endpoints.service';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';

@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @Post()
  create(@Body() dto: CreateEndpointDto) {
    return this.endpointsService.create(dto);
  }

  @Get()
  findAll() {
    return this.endpointsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.endpointsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEndpointDto) {
    return this.endpointsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.endpointsService.softDelete(id);
  }
}