import { IsString } from 'class-validator';

export class AssignRoleDto {
    @IsString()
    role: string;
}