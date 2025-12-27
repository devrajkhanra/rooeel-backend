import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @IsOptional()
    @IsString()
    @IsEnum(['pending', 'accepted', 'todo', 'in-progress', 'done'])
    status?: string;

    @IsOptional()
    @IsObject()
    submissionData?: any;
}
