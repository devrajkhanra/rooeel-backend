import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SignupAdminDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsEmail()
    @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}
