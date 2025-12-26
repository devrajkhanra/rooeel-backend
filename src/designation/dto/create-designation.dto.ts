import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateDesignationDto {
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name: string;

    @IsOptional()
    @IsString()
    @MinLength(10, { message: 'Description must be at least 10 characters long' })
    @MaxLength(500, { message: 'Description must not exceed 500 characters' })
    description?: string;
}
