import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentParentContext } from '../common/decorators/current-parent.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentParent } from '../common/interfaces/current-parent.interface';
import { AcceptFamilyInviteDto } from './dto/accept-family-invite.dto';
import { InviteParentDto } from './dto/invite-parent.dto';
import { FamilyService } from './family.service';

@ApiTags('family')
@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @UseGuards(JwtAuthGuard)
  @Post('invite')
  inviteParent(
    @CurrentParentContext() currentParent: CurrentParent,
    @Body() payload: InviteParentDto,
  ): Promise<{ inviteId: string; token: string; expiresAt: string }> {
    return this.familyService.inviteParent(currentParent, payload);
  }

  @Post('invite/accept')
  acceptInvite(
    @Body() payload: AcceptFamilyInviteDto,
  ): Promise<{
    accessToken: string;
    expiresIn: string;
    parentId: string;
    familyId: string;
  }> {
    return this.familyService.acceptInvite(payload);
  }
}
