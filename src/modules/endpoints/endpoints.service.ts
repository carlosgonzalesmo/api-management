import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Endpoint } from './endpoint.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';

@Injectable()
export class EndpointsService {
  constructor(
    @InjectRepository(Endpoint)
    private readonly endpointRepo: Repository<Endpoint>,
  ) {}

  async create(dto: CreateEndpointDto): Promise<Endpoint> {
    const entity = this.endpointRepo.create({
      ...dto,
      method: dto.method.toUpperCase(),
      authType: (dto.authType || 'NONE').toUpperCase(),
    });
    return this.endpointRepo.save(entity);
  }

  async findAll(): Promise<Endpoint[]> {
    return this.endpointRepo.find({
      where: {},
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Endpoint> {
    const endpoint = await this.endpointRepo.findOne({ where: { id } });
    if (!endpoint) {
      throw new NotFoundException('Endpoint no encontrado');
    }
    return endpoint;
  }

  async update(id: string, dto: UpdateEndpointDto): Promise<Endpoint> {
    const endpoint = await this.findOne(id);
    if (dto.method) dto.method = dto.method.toUpperCase();
    if (dto.authType) dto.authType = dto.authType.toUpperCase();
    Object.assign(endpoint, dto);
    return this.endpointRepo.save(endpoint);
  }

  async softDelete(id: string): Promise<void> {
    const endpoint = await this.findOne(id);
    await this.endpointRepo.softRemove(endpoint);
  }
}