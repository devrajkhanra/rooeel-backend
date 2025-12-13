import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectService } from './project.service';

@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  createProject(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    return this.projectService.createProject(req.user.userId, createProjectDto);
  }

  @Get()
  getProjects(@Request() req) {
    return this.projectService.getProjects(req.user.userId);
  }

  @Get(':id')
  getProjectById(@Request() req, @Param('id') id: string) {
    return this.projectService.getProjectById(req.user.userId, parseInt(id, 10));
  }

  @Patch(':id')
  updateProject(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(
      req.user.userId,
      parseInt(id, 10),
      updateProjectDto,
    );
  }

  @Delete(':id')
  deleteProject(@Request() req, @Param('id') id: string) {
    return this.projectService.deleteProject(req.user.userId, parseInt(id, 10));
  }
}
