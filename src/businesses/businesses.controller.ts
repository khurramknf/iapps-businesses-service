// File: services/businesses-service/backend/src/businesses/businesses.controller.ts
import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { QueryBusinessDto } from './dto/query-business.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BusinessAccessGuard } from '../common/guards/business-access.guard';
import { Action } from '../common/decorators/action.decorator';

@Controller('businesses')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(JwtAuthGuard, BusinessAccessGuard)
export class BusinessesController {
  constructor(private readonly svc: BusinessesService) {}

  @Action('list')
  @Get()
  async list(@Query() q: QueryBusinessDto, @Req() req: any) {
    // coerce includeDeleted to a strict boolean (accepts true/'true'/1/'1')
    const includeDeleted =
      (q as any).includeDeleted === true ||
      (q as any).includeDeleted === 'true' ||
      (q as any).includeDeleted === 1 ||
      (q as any).includeDeleted === '1';

    return this.svc.list({ ...q, includeDeleted } as any, req.user);
  }

  @Action('read')
  @Get(':id')
  async one(@Param('id') id: string) {
    const business = await this.svc.findOne(id);
    return { business };
  }

  @Action('create')
  @Post()
  async create(@Body() dto: CreateBusinessDto, @Req() req: any) {
    const business = await this.svc.create(dto, req.user?.id ?? 'system');
    return { business };
  }

  @Action('update')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto, @Req() req: any) {
    const business = await this.svc.update(id, dto, req.user?.id ?? 'system');
    return { business };
  }

  @Action('delete')
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.svc.softDelete(id, req.user?.id ?? 'system');
  }

  @Action('restore')
  @Post(':id/restore')
  async restore(@Param('id') id: string, @Req() req: any) {
    const business = await this.svc.restore(id, req.user?.id ?? 'system');
    return { business };
  }

  @Action('approve')
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any) {
    const business = await this.svc.approve(id, req.user?.id ?? 'system');
    return { business };
  }

  @Action('reject')
  @Post(':id/reject')
  async reject(@Param('id') id: string, @Req() req: any) {
    const business = await this.svc.reject(id, req.user?.id ?? 'system');
    return { business };
  }

  @Action('suspend')
  @Post(':id/suspend')
  async suspend(@Param('id') id: string, @Req() req: any) {
    const business = await this.svc.suspend(id, req.user?.id ?? 'system');
    return { business };
  }

  @Action('manageManagers')
  @Get(':id/managers')
  async managers(@Param('id') id: string) {
    return this.svc.listManagers(id);
  }

  @Action('manageManagers')
  @Post(':id/managers')
  async addManager(@Param('id') id: string, @Body() dto: AssignManagerDto, @Req() req: any) {
    const manager = await this.svc.addManager(id, dto, req.user?.id ?? 'system');
    return { manager };
  }

  @Action('manageManagers')
  @Delete(':id/managers/:userId')
  async removeManager(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any) {
    return this.svc.removeManager(id, userId, req.user?.id ?? 'system');
  }
}
