import { IsInt, IsPositive } from 'class-validator';

export class AssignUserDto {
    @IsInt({ message: 'User ID must be an integer' })
    @IsPositive({ message: 'User ID must be a positive number' })
    userId: number;
}
