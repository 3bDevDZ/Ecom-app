import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Render,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import {
  PublishContentCommand,
  UpdateContactSectionCommand,
  UpdateFooterContentCommand,
  UpdateHeroCommand,
  UpdateProductShowcaseCommand,
  UpdateShowroomInfoCommand,
  UpdateTrustLogosCommand,
} from '../../application/commands';
import { UpdateContactSectionDto } from '../../application/dtos/update-contact-section.dto';
import { UpdateFooterContentDto } from '../../application/dtos/update-footer-content.dto';
import { UpdateHeroDto } from '../../application/dtos/update-hero.dto';
import { UpdateProductShowcaseDto } from '../../application/dtos/update-product-showcase.dto';
import { UpdateShowroomInfoDto } from '../../application/dtos/update-showroom-info.dto';
import { UpdateTrustLogosDto } from '../../application/dtos/update-trust-logos.dto';
import { GetLandingContentQuery } from '../../application/queries/get-landing-content.query';
import { LandingPresenter } from '../presenters/landing.presenter';

@Controller('api/cms/landing')
@UseGuards(JwtAuthGuard) // All CMS endpoints require authentication
export class LandingCmsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly presenter: LandingPresenter,
  ) { }

  // T243: GET /api/cms/landing/hero
  @Get('hero')
  async getHero() {
    const content = await this.queryBus.execute(new GetLandingContentQuery(true));
    if (!content) {
      throw new HttpException('Landing page content not found', HttpStatus.NOT_FOUND);
    }
    return { heroSection: content.heroSection };
  }

  // T244: PUT /api/cms/landing/hero
  @Put('hero')
  async updateHero(@Body() dto: UpdateHeroDto) {
    const command = new UpdateHeroCommand(
      dto.heading,
      dto.subheading,
      dto.backgroundImageUrl,
      dto.ctaButtonText,
      dto.ctaButtonLink,
    );

    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Hero section updated successfully' };
  }

  // T245: GET /api/cms/landing/trust-logos
  @Get('trust-logos')
  async getTrustLogos() {
    const content = await this.queryBus.execute(new GetLandingContentQuery(true));
    if (!content) {
      throw new HttpException('Landing page content not found', HttpStatus.NOT_FOUND);
    }
    return { trustLogos: content.trustLogos };
  }

  // T246: POST /api/cms/landing/trust-logos
  @Post('trust-logos')
  async updateTrustLogos(@Body() dto: UpdateTrustLogosDto) {
    const command = new UpdateTrustLogosCommand(dto.logos);
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Trust logos updated successfully' };
  }

  // T247: DELETE /api/cms/landing/trust-logos/:id
  @Delete('trust-logos/:id')
  async removeTrustLogo(@Param('id') id: string) {
    // Get current content
    const content = await this.queryBus.execute(new GetLandingContentQuery(true));
    if (!content) {
      throw new HttpException('Landing page content not found', HttpStatus.NOT_FOUND);
    }

    // Filter out the logo
    const updatedLogos = content.trustLogos.filter((logo) => logo.id !== id);

    // Update with filtered list
    const command = new UpdateTrustLogosCommand(updatedLogos);
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Trust logo removed successfully' };
  }

  // T248: GET /api/cms/landing/showcase
  @Get('showcase')
  async getShowcase() {
    const content = await this.queryBus.execute(new GetLandingContentQuery(true));
    if (!content) {
      throw new HttpException('Landing page content not found', HttpStatus.NOT_FOUND);
    }
    return { productShowcase: content.productShowcase };
  }

  // T249: PUT /api/cms/landing/showcase
  @Put('showcase')
  async updateShowcase(@Body() dto: UpdateProductShowcaseDto) {
    const command = new UpdateProductShowcaseCommand(dto.categories);
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Product showcase updated successfully' };
  }

  // T250: GET /api/cms/landing/preview
  @Get('preview')
  @Render('landing')
  async preview() {
    const content = await this.queryBus.execute(new GetLandingContentQuery(true));
    if (!content) {
      throw new HttpException('Landing page content not found', HttpStatus.NOT_FOUND);
    }

    return this.presenter.toLandingPageView(content, true);
  }

  // T251: POST /api/cms/landing/publish
  @Post('publish')
  async publish() {
    const command = new PublishContentCommand();
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Landing page published successfully' };
  }

  // Additional endpoints for other sections
  @Put('showroom')
  async updateShowroom(@Body() dto: UpdateShowroomInfoDto) {
    const command = new UpdateShowroomInfoCommand(
      dto.address,
      dto.businessHours,
      dto.mapImageUrl,
    );
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Showroom info updated successfully' };
  }

  @Put('contact')
  async updateContact(@Body() dto: UpdateContactSectionDto) {
    const command = new UpdateContactSectionCommand(dto.heading, dto.description);
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Contact section updated successfully' };
  }

  @Put('footer')
  async updateFooter(@Body() dto: UpdateFooterContentDto) {
    const command = new UpdateFooterContentCommand(
      dto.companyDescription,
      dto.navigationLinks,
      dto.copyrightText,
    );
    const result = await this.commandBus.execute(command);

    if (result.isFailure) {
      throw new HttpException(result.errorValue, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Footer content updated successfully' };
  }
}

// Public landing page controller (no auth required)
@Controller()
export class LandingPageController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly presenter: LandingPresenter,
  ) { }

  @Get()
  @Render('landing')
  async getLandingPage() {
    const content = await this.queryBus.execute(new GetLandingContentQuery(false));

    if (!content) {
      // Return default content if nothing is published
      return this.presenter.getDefaultLandingPage();
    }

    return this.presenter.toLandingPageView(content, false);
  }
}
