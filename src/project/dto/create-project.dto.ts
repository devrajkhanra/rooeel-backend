import { IsString, IsOptional, MinLength, IsEnum, IsArray, ValidateNested, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProjectStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    COMPLETED = 'completed',
}

export class ProjectFieldDto {
    @IsString()
    name: string;

    @IsString()
    label: string;

    @IsString()
    fieldType: string; // 'text', 'number', 'date', 'select', 'textarea', 'file'

    @IsOptional()
    options?: { value: string; label: string }[];

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsNumber()
    sortOrder?: number;
}

export class CreateProjectDto {
    @IsString()
    @MinLength(3, { message: 'Project name must be at least 3 characters long' })
    name: string;

    @IsOptional()
    @IsString()
    @MinLength(10, { message: 'Description must be at least 10 characters long' })
    description?: string;

    @IsOptional()
    @IsEnum(ProjectStatus, { message: 'Status must be active, inactive, or completed' })
    status?: ProjectStatus;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProjectFieldDto)
    fields?: ProjectFieldDto[];
}
