import { IsNotEmpty, IsString } from 'class-validator';

export class AssignRoleDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    role: string;
}
