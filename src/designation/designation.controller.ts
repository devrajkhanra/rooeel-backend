import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { DesignationService } from './services/designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('designation')
@UseGuards(AdminGuard)
export class DesignationController {
    constructor(private readonly designationService: DesignationService) { }

    @Post()
    create(@Body() createDesignationDto: CreateDesignationDto) {
        return this.designationService.create(createDesignationDto);
    }

    @Get()
    findAll() {
        return this.designationService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.designationService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDesignationDto: UpdateDesignationDto,
    ) {
        return this.designationService.update(id, updateDesignationDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.designationService.remove(id);
    }
}
