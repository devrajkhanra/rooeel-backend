import { IsString, IsIn, IsOptional, MinLength } from 'class-validator';

export class CreateRequestDto {
    @IsString()
    @IsIn(['firstName', 'lastName', 'email', 'password'])
    requestType: 'firstName' | 'lastName' | 'email' | 'password';

    @IsString()
    @MinLength(1)
    requestedValue: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    currentPassword?: string; // Required only for password change requests
}
