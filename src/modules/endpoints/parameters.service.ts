import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EndpointParameter } from './endpoint-parameter.entity';
import { Repository } from 'typeorm';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { Endpoint } from './endpoint.entity';

@Injectable()
export class EndpointParametersService {
  constructor(
    @InjectRepository(EndpointParameter)
    private readonly paramRepo: Repository<EndpointParameter>,
    @InjectRepository(Endpoint)
    private readonly endpointRepo: Repository<Endpoint>,
  ) {}

  async create(endpointId: string, dto: CreateParameterDto): Promise<EndpointParameter> {
    // Verificar endpoint
    const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId } });
    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    // Validaciones simples extra:
    // 1) Evitar duplicados (mismo nombre + location por endpoint)
    const existing = await this.paramRepo.findOne({
      where: { endpointId, name: dto.name, location: dto.location },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un parámetro con ese nombre y ubicación');
    }

    const param = this.paramRepo.create({
      ...dto,
      endpointId,
    });
    return this.paramRepo.save(param);
  }

  async listByEndpoint(endpointId: string): Promise<EndpointParameter[]> {
    return this.paramRepo.find({
      where: { endpointId },
      order: { createdAt: 'ASC' },
    });
  }

  async delete(paramId: string): Promise<void> {
    const param = await this.paramRepo.findOne({ where: { id: paramId } });
    if (!param) throw new NotFoundException('Parámetro no encontrado');
    await this.paramRepo.remove(param);
  }
}