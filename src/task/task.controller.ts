import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { TaskService } from './services/task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('task')
@UseGuards(JwtAuthGuard)
export class TaskController {
    constructor(private readonly taskService: TaskService) { }

    @UseGuards(AdminGuard)
    @Post()
    create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
        return this.taskService.create(createTaskDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.taskService.findAll(req.user);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.taskService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
        return this.taskService.update(id, updateTaskDto, req.user);
    }

    @UseGuards(AdminGuard)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.taskService.remove(id, req.user.userId);
    }
}
