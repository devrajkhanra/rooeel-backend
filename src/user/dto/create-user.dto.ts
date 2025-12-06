import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ description: 'The first name of the user' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ description: 'The last name of the user' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ description: 'The email of the user' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'The password of the user' })
    @IsString()
    @MinLength(8)
    password: string;
}
