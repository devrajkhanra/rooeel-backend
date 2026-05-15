import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

export enum ProjectStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    COMPLETED = 'completed',
}

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @IsOptional()
    @IsString()
    workOrderPdf?: string;
}
