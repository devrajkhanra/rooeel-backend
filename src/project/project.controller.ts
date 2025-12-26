import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { AssignDesignationDto } from './dto/assign-designation.dto';
import { SetUserDesignationDto } from './dto/set-user-designation.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('project')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    @UseGuards(AdminGuard)
    @Post()
    create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
        const adminId = req.user.userId;
        return this.projectService.create(adminId, createProjectDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Request() req) {
        const userId = req.user.userId;
        const role = req.user.role;
        return this.projectService.findAll(userId, role);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.projectService.findOne(id);
    }

    @UseGuards(AdminGuard)
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() updateProjectDto: UpdateProjectDto,
    ) {
        const adminId = req.user.userId;
        return this.projectService.update(id, adminId, updateProjectDto);
    }

    @UseGuards(AdminGuard)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const adminId = req.user.userId;
        return this.projectService.remove(id, adminId);
    }

    @UseGuards(AdminGuard)
    @Post(':id/assign-user')
    async assignUser(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() assignUserDto: AssignUserDto,
    ) {
        const adminId = req.user.userId;
        const assignedUsers = await this.projectService.assignUser(id, assignUserDto.userId, adminId);
        return { assignedUsers };
    }

    @UseGuards(AdminGuard)
    @Delete(':id/remove-user/:userId')
    async removeUser(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Request() req,
    ) {
        const adminId = req.user.userId;
        const assignedUsers = await this.projectService.removeUser(id, userId, adminId);
        return { assignedUsers };
    }

    @UseGuards(AdminGuard)
    @Post(':id/assign-designation')
    async assignDesignation(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() assignDesignationDto: AssignDesignationDto,
    ) {
        const adminId = req.user.userId;
        const assignedDesignations = await this.projectService.assignDesignation(id, assignDesignationDto.designationId, adminId);
        return { assignedDesignations };
    }

    @UseGuards(AdminGuard)
    @Delete(':id/remove-designation/:designationId')
    async removeDesignation(
        @Param('id', ParseIntPipe) id: number,
        @Param('designationId', ParseIntPipe) designationId: number,
        @Request() req,
    ) {
        const adminId = req.user.userId;
        const assignedDesignations = await this.projectService.removeDesignation(id, designationId, adminId);
        return { assignedDesignations };
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/designations')
    getProjectDesignations(@Param('id', ParseIntPipe) id: number) {
        return this.projectService.getProjectDesignations(id);
    }

    @UseGuards(AdminGuard)
    @Patch(':id/user/:userId/designation')
    async setUserDesignation(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Request() req,
        @Body() setUserDesignationDto: SetUserDesignationDto,
    ) {
        const adminId = req.user.userId;
        const user = await this.projectService.setUserDesignation(id, userId, setUserDesignationDto.designationId, adminId);
        return {
            message: 'Designation assigned successfully',
            user,
        };
    }

    @UseGuards(AdminGuard)
    @Delete(':id/user/:userId/designation')
    async removeUserDesignation(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Request() req,
    ) {
        const adminId = req.user.userId;
        const user = await this.projectService.removeUserDesignation(id, userId, adminId);
        return {
            message: 'Designation removed successfully',
            user,
        };
    }
}
