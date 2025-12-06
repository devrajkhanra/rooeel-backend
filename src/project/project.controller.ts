import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AssignProjectDto } from './dto/assign-project.dto';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { CurrentAdmin } from '../admin/decorators/current-admin.decorator';

@Controller('project')
@UseGuards(AdminAuthGuard)
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    @Post()
    create(@CurrentAdmin() admin: any, @Body() createProjectDto: CreateProjectDto) {
        return this.projectService.create(admin.id, createProjectDto);
    }

    @Get()
    findAll(@CurrentAdmin() admin: any) {
        return this.projectService.findAll(admin.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @CurrentAdmin() admin: any) {
        return this.projectService.findOne(id, admin.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @CurrentAdmin() admin: any, @Body() updateProjectDto: Partial<CreateProjectDto>) {
        return this.projectService.update(id, admin.id, updateProjectDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentAdmin() admin: any) {
        return this.projectService.remove(id, admin.id);
    }

    @Post(':id/assign')
    assign(@Param('id') id: string, @CurrentAdmin() admin: any, @Body() body: AssignProjectDto) {
        return this.projectService.assignUser(id, body.userId, admin.id);
    }

    @Post(':id/unassign')
    unassign(@Param('id') id: string, @CurrentAdmin() admin: any, @Body() body: AssignProjectDto) {
        return this.projectService.unassignUser(id, body.userId, admin.id);
    }

    @Get(':id/users')
    getAssignedUsers(@Param('id') id: string, @CurrentAdmin() admin: any) {
        return this.projectService.getAssignedUsers(id, admin.id);
    }
}
