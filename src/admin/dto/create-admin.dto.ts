import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAdminDto {
    @IsString()
    name: string;

    @IsEmail()
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @IsOptional()
    @IsString()
    role?: string;
}