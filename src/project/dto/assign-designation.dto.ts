import { IsInt, IsPositive } from 'class-validator';

export class AssignDesignationDto {
    @IsInt()
    @IsPositive()
    designationId: number;
}
