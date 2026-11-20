import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { SITE_CONFIG } from '../config/site.config';

/** Appends the studio name from the white-label config to every page title. */
@Injectable()
export class StudioTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      pageTitle ? `${pageTitle} | ${SITE_CONFIG.studioName}` : SITE_CONFIG.studioName,
    );
  }

}
