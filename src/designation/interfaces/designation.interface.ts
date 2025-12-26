import { Designation } from '@prisma/client';
import { CreateDesignationDto } from '../dto/create-designation.dto';
import { UpdateDesignationDto } from '../dto/update-designation.dto';

export interface IDesignationService {
    create(createDesignationDto: CreateDesignationDto): Promise<Designation>;
    findAll(): Promise<Designation[]>;
    findOne(id: number): Promise<Designation>;
    update(id: number, updateDesignationDto: UpdateDesignationDto): Promise<Designation>;
    remove(id: number): Promise<Designation>;
}
