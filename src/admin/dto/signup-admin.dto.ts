import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SignupAdminDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEmail()
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}