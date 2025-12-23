import { IsString, IsOptional, MinLength, IsEnum } from 'class-validator';

export enum ProjectStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    COMPLETED = 'completed',
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
}
