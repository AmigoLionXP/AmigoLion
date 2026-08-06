import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { CompanyService } from './company.service';

@Controller('me/company')
@Roles('client')
export class CompanyController {
  constructor(private company: CompanyService) {}

  @Get()
  getCompany(@CurrentUser() user: AuthUser) {
    return this.company.getMyCompany(user.sub, user.companyId);
  }

  @Get('steps')
  getSteps(@CurrentUser() user: AuthUser) {
    return this.company.getMySteps(user.sub, user.companyId);
  }

  @Get('steps/:n')
  getStep(@CurrentUser() user: AuthUser, @Param('n', ParseIntPipe) n: number) {
    return this.company.getStep(user.sub, user.companyId, n);
  }
}
