import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import i18next, { i18n } from 'i18next';
import Backend from 'i18next-fs-backend';
import * as middleware from 'i18next-http-middleware';

@Injectable()
export class I18nService {
  private i18n: i18n;

  constructor(private configService: ConfigService) {
    this.i18n = i18next;
    this.init();
  }

  private async init() {
    await this.i18n
      .use(Backend)
      .use(middleware.LanguageDetector)
      .init({
        backend: {
          loadPath: './locales/{{lng}}/{{ns}}.json',
        },
        fallbackLng: 'en',
        preload: ['en', 'sw'],
        ns: ['common', 'validation', 'errors'],
        defaultNS: 'common',
        detection: {
          order: ['header', 'cookie', 'querystring'],
          lookupHeader: 'accept-language',
          lookupCookie: 'language',
          lookupQuerystring: 'lang',
          caches: ['cookie'],
        },
      });
  }

  async translate(key: string, options?: any): Promise<string> {
    return this.i18n.t(key, options) as string;
  }

  async getLanguages(): Promise<string[]> {
    return Object.keys(this.i18n.languages);
  }

  async changeLanguage(lng: string): Promise<void> {
    await this.i18n.changeLanguage(lng);
  }

  getMiddleware(): any {
    return middleware.handle(this.i18n);
  }
} 