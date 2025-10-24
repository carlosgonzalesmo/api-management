import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ExecutionsService } from './executions.service';
import { ExecuteEndpointDto } from './dto/execute-endpoint.dto';

@Controller()
export class ExecutionsController {
    constructor(private readonly execs: ExecutionsService) {}

    @Post('endpoints/:endpointId/execute')
    execute(@Param('endpointId') endpointId: string, @Body() dto: ExecuteEndpointDto) {
        return this.execs.executeManual(endpointId, dto);
    }

    // Listar ejecuciones recientes para un endpoint (opcional: filtrado por schedule)
    @Get('endpoints/:endpointId/executions')
    list(
        @Param('endpointId') endpointId: string,
        @Query('limit') limit = '20',
        @Query('scheduleId') scheduleId?: string,
    ) {
        const take = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        return this.execs.listExecutions(endpointId, take, scheduleId);
    }
}