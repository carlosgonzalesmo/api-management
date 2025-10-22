import { Body, Controller, Param, Post } from '@nestjs/common';
import { ExecutionsService } from './executions.service';
import { ExecuteEndpointDto } from './dto/execute-endpoint.dto';

@Controller()
export class ExecutionsController {
    constructor(private readonly execs: ExecutionsService) { }

    @Post('endpoints/:endpointId/execute')
    execute(@Param('endpointId') endpointId: string, @Body() dto: ExecuteEndpointDto) {
        return this.execs.executeManual(endpointId, dto);
    }
}