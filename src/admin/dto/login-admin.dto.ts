import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginAdminDto {
    @IsEmail()
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}