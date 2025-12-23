import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { RequestService } from './services/request.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UserGuard } from '../auth/user.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('request')
export class RequestController {
    constructor(private readonly requestService: RequestService) { }

    @UseGuards(UserGuard)
    @Post()
    create(@Request() req, @Body() createRequestDto: CreateRequestDto) {
        const userId = req.user.sub;
        return this.requestService.createRequest(userId, createRequestDto);
    }

    @UseGuards(UserGuard)
    @Get('my-requests')
    findMyRequests(@Request() req) {
        const userId = req.user.sub;
        return this.requestService.findAllByUser(userId);
    }

    @UseGuards(AdminGuard)
    @Get('admin-requests')
    findAdminRequests(@Request() req) {
        const adminId = req.user.sub;
        return this.requestService.findAllByAdmin(adminId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.requestService.findOne(id);
    }

    @UseGuards(AdminGuard)
    @Patch(':id/approve')
    approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const adminId = req.user.sub;
        return this.requestService.approveRequest(id, adminId);
    }

    @UseGuards(AdminGuard)
    @Patch(':id/reject')
    reject(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const adminId = req.user.sub;
        return this.requestService.rejectRequest(id, adminId);
    }
}
