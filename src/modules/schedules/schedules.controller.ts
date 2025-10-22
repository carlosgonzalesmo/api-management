import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller()
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Post('endpoints/:endpointId/schedules')
  create(
    @Param('endpointId') endpointId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedules.create(endpointId, dto);
  }

  @Get('endpoints/:endpointId/schedules')
  list(@Param('endpointId') endpointId: string) {
    return this.schedules.listByEndpoint(endpointId);
  }

  @Patch('schedules/:id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedules.update(id, dto);
  }

  @Delete('schedules/:id')
  delete(@Param('id') id: string) {
    return this.schedules.delete(id);
  }
}