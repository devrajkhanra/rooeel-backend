import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
    @ApiProperty({ description: 'The name of the project' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'The description of the project' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'The work order number of the project' })
    @IsString()
    @IsNotEmpty()
    workOrderNumber: string;

    @ApiProperty({ description: 'The date of the project (dd-MM-YYYY)', example: '25-12-2023' })
    @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'Date must be in the format dd-MM-YYYY' })
    @IsNotEmpty()
    date: string;

    @ApiProperty({ description: 'The entity that awarded the project' })
    @IsString()
    @IsNotEmpty()
    awardedBy: string;

    @ApiProperty({ description: 'The address of the awarder' })
    @IsString()
    @IsNotEmpty()
    awarderAddress: string;

    @ApiProperty({ description: 'The engineer in charge of the project' })
    @IsString()
    @IsNotEmpty()
    engineerInCharge: string;

    @ApiProperty({ description: 'The status of the project' })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({ description: 'The start date of the project (dd-MM-YYYY)', example: '01-01-2024' })
    @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'Start date must be in the format dd-MM-YYYY' })
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ description: 'The end date of the project (dd-MM-YYYY)', example: '31-12-2024' })
    @Matches(/^\d{2}-\d{2}-\d{4}$/, { message: 'End date must be in the format dd-MM-YYYY' })
    @IsNotEmpty()
    endDate: string;
}
