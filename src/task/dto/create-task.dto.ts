import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsArray } from 'class-validator';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsArray()
    formSchema?: any[];

    @IsInt()
    @IsNotEmpty()
    projectId: number;

    @IsOptional()
    @IsInt()
    assignedTo?: number;
}
