import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDesignationDto } from '../dto/create-designation.dto';
import { UpdateDesignationDto } from '../dto/update-designation.dto';
import { IDesignationService } from '../interfaces/designation.interface';
import { CustomLogger } from '../../logger/logger.service';
import { Designation } from '@prisma/client';

@Injectable()
export class DesignationService implements IDesignationService {
    private readonly logger: CustomLogger;

    constructor(private readonly prisma: PrismaService) {
        this.logger = new CustomLogger();
        this.logger.setContext(DesignationService.name);
    }

    async create(createDesignationDto: CreateDesignationDto): Promise<Designation> {
        this.logger.debug(`Creating designation: ${createDesignationDto.name}`);

        // Check if designation with same name already exists
        const existing = await this.prisma.designation.findUnique({
            where: { name: createDesignationDto.name },
        });

        if (existing) {
            throw new ConflictException('Designation with this name already exists');
        }

        const designation = await this.prisma.designation.create({
            data: createDesignationDto,
        });

        this.logger.log(`Designation created: ${designation.name} (ID: ${designation.id})`);
        return designation;
    }

    async findAll(): Promise<Designation[]> {
        this.logger.debug('Fetching all designations');
        return this.prisma.designation.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: number): Promise<Designation> {
        this.logger.debug(`Fetching designation with ID: ${id}`);

        const designation = await this.prisma.designation.findUnique({
            where: { id },
        });

        if (!designation) {
            throw new NotFoundException(`Designation with ID ${id} not found`);
        }

        return designation;
    }

    async update(id: number, updateDesignationDto: UpdateDesignationDto): Promise<Designation> {
        this.logger.debug(`Updating designation with ID: ${id}`);

        // Check if designation exists
        await this.findOne(id);

        // If name is being updated, check for conflicts
        if (updateDesignationDto.name) {
            const existing = await this.prisma.designation.findUnique({
                where: { name: updateDesignationDto.name },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException('Designation with this name already exists');
            }
        }

        const designation = await this.prisma.designation.update({
            where: { id },
            data: updateDesignationDto,
        });

        this.logger.log(`Designation updated: ${designation.name} (ID: ${designation.id})`);
        return designation;
    }

    async remove(id: number): Promise<Designation> {
        this.logger.debug(`Deleting designation with ID: ${id}`);

        // Check if designation exists
        await this.findOne(id);

        const designation = await this.prisma.designation.delete({
            where: { id },
        });

        this.logger.log(`Designation deleted: ${designation.name} (ID: ${designation.id})`);
        return designation;
    }
}
