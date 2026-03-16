import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentAdminContext } from '../common/decorators/current-admin.decorator';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { CurrentAdmin } from '../common/interfaces/current-admin.interface';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@ApiTags('admin-auth')
@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  login(@Body() payload: AdminLoginDto): Promise<{
    accessToken: string;
    expiresIn: string;
    adminUserId: string;
    username: string;
    displayName: string;
    role: string;
  }> {
    return this.adminAuthService.login(payload);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('me')
  getMe(@CurrentAdminContext() currentAdmin: CurrentAdmin): Promise<{
    adminUserId: string;
    username: string;
    displayName: string;
    role: string;
  }> {
    return this.adminAuthService.getCurrentAdminProfile(currentAdmin);
  }
}
