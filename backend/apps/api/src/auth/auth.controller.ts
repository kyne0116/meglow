import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentParentContext } from '../common/decorators/current-parent.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  sendCode(@Body() payload: SendVerificationCodeDto): Promise<{
    success: true;
    expiresInSec: number;
  }> {
    return this.authService.sendCode(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto): Promise<{
    accessToken: string;
    expiresIn: string;
    parentId: string;
    familyId: string;
  }> {
    return this.authService.login(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentParentContext() currentParent: CurrentParent): Promise<{
    parentId: string;
    familyId: string;
    phone: string;
    nickname: string | null;
    role: 'OWNER' | 'MEMBER';
  }> {
    return this.authService.getCurrentParentProfile(currentParent);
  }
}
