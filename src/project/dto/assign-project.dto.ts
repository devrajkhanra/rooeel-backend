import { IsString, IsNotEmpty } from 'class-validator';

export class AssignProjectDto {
    @IsString()
    @IsNotEmpty()
    userId: string;
}
