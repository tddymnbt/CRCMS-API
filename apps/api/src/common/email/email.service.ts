import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import { config as dotenvConfig } from 'dotenv';
import * as hbs from 'handlebars';

dotenvConfig({ path: '.env' });

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: `${process.env.SMTP_HOST}`,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: `${process.env.SMTP_USERNAME}`,
        pass: `${process.env.SMTP_PASSWORD}`,
      },
    });
  }

  async sendEmail(
    templateData: { [key: string]: string },
    templateName: string,
    to: string,
    subject: string,
  ): Promise<void> {
    const currentDirectory = path.join(
      process.cwd(),
      'src',
      'common',
      'email',
      'template',
    );
    const backgroundImagePath = path.join(currentDirectory, 'wood.png');
    const philGoodLogoPath = path.join(
      currentDirectory,
      'mediflexlogowordmark.png',
    );
    const facebookIconPath = path.join(currentDirectory, 'fb.png');
    const instagramIconPath = path.join(currentDirectory, 'ig.png');
    const twitterIconPath = path.join(currentDirectory, 'x.png');
    const tiktokIconPath = path.join(currentDirectory, 'tktk.png');
    const linkedinIconPath = path.join(currentDirectory, 'li.png');

    const templatePath = path.join(currentDirectory, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = hbs.compile(templateSource);

    const htmlContent = template(templateData);

    const mailOptions = {
      from: `${process.env.SMTP_FROM}`,
      to,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: 'wood.png',
          path: backgroundImagePath,
          cid: 'backgroundimage',
        },
        {
          filename: 'pg.png',
          path: philGoodLogoPath,
          cid: 'philgoodlogo',
        },
        {
          filename: 'fb.png',
          path: facebookIconPath,
          cid: 'facebookicon',
        },
        {
          filename: 'ig.png',
          path: instagramIconPath,
          cid: 'instagramicon',
        },
        {
          filename: 'x.png',
          path: twitterIconPath,
          cid: 'twittericon',
        },
        {
          filename: 'tktk.png',
          path: tiktokIconPath,
          cid: 'tiktokicon',
        },
        {
          filename: 'li.png',
          path: linkedinIconPath,
          cid: 'linkedinicon',
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOnboardingEmail(
    templateData: { [key: string]: string },
    templateName: string,
    to: string,
    subject: string,
  ): Promise<void> {
    const currentDirectory = path.join(
      process.cwd(),
      'src',
      'common',
      'email',
      'template',
    );
    const mediflexBanner = path.join(currentDirectory, 'mf_banner.png');
    const mediflexFooter = path.join(
      currentDirectory,
      'mediflexlogowordmark.png',
    );
    const facebookIconPath = path.join(currentDirectory, 'fb.png');
    const instagramIconPath = path.join(currentDirectory, 'ig.png');
    const twitterIconPath = path.join(currentDirectory, 'x.png');
    const tiktokIconPath = path.join(currentDirectory, 'tktk.png');
    const linkedinIconPath = path.join(currentDirectory, 'li.png');

    const templatePath = path.join(currentDirectory, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = hbs.compile(templateSource);

    const htmlContent = template(templateData);

    const mailOptions = {
      from: `${process.env.SMTP_FROM}`,
      to,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: 'mf_banner.png',
          path: mediflexBanner,
          cid: 'backgroundimage',
        },
        {
          filename: 'mediflexlogowordmark.png',
          path: mediflexFooter,
          cid: 'philgoodlogo',
        },
        {
          filename: 'fb.png',
          path: facebookIconPath,
          cid: 'facebookicon',
        },
        {
          filename: 'ig.png',
          path: instagramIconPath,
          cid: 'instagramicon',
        },
        {
          filename: 'x.png',
          path: twitterIconPath,
          cid: 'twittericon',
        },
        {
          filename: 'tktk.png',
          path: tiktokIconPath,
          cid: 'tiktokicon',
        },
        {
          filename: 'li.png',
          path: linkedinIconPath,
          cid: 'linkedinicon',
        },
      ],
    };

    await this.transporter.sendMail(mailOptions);
  }
}
