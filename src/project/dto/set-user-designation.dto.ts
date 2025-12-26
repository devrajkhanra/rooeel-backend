import { IsInt, IsPositive } from 'class-validator';

export class SetUserDesignationDto {
    @IsInt()
    @IsPositive()
    designationId: number;
}
