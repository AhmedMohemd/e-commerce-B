import { BadRequestException, Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {

  private EMAIL_APP: string;
  private EMAIL_APP_PASSWORD: string;
  private APPLICATION_NAME: string;
  private TWITTERLINK: string;
  private INSTAGRAM: string;
  private FACEBOOKLINK: string;

  constructor(private readonly configService: ConfigService) {
    this.EMAIL_APP = this.configService.get<string>("EMAIL_APP") as string;
    this.EMAIL_APP_PASSWORD = this.configService.get<string>("EMAIL_APP_PASSWORD") as string;
    this.APPLICATION_NAME = this.configService.get<string>("APPLICATION_NAME") as string;
    this.TWITTERLINK = this.configService.get<string>("TWITTERLINK") as string;
    this.FACEBOOKLINK = this.configService.get<string>("FACEBOOKLINK") as string;
    this.INSTAGRAM = this.configService.get<string>("INSTAGRAM") as string;
  }
  async sendEmail({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments = [],
  }: Mail.Options): Promise<void> {
    if (!to && !cc && !bcc) {
      throw new BadRequestException(
        "Invalid request: At least one recipient must be provided",
      );
    }
    if (!(html as string)?.length && !attachments.length) {
      throw new BadRequestException(
        "Invalid request: Either HTML content or attachments must be provided",
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: this.EMAIL_APP,
        pass: this.EMAIL_APP_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      to,
      cc,
      bcc,
      subject,
      html,
      attachments,
      from: `"${this.APPLICATION_NAME} 🎈" <${this.EMAIL_APP}>`,
    });
    console.log("Message sent:", info.messageId);
  };
  emailTemplate({
    code,
    title,
  }: {
    title: string,
    code: number,
  }) {
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body {
        margin:0; padding:0; background:#f5f5f5;
        font-family: 'Helvetica Neue', Arial, sans-serif;
      }
      .card {
        background:#fff;
        width:400px;
        margin:50px auto;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 15px 35px rgba(0,0,0,0.25);
      }
      .header {
        background: linear-gradient(135deg, #4B1E55, #FF87A2, #F0C23C);
        padding:25px;
        color:#fff;
        text-align:center;
      }
      .header h1 {
        margin:0; font-size:24px; letter-spacing:1px; font-weight:bold;
      }
      .body {
        padding:35px 25px; text-align:center;
      }
      .body h2 {
        color:#4B1E55; margin-bottom:10px; font-size:20px;
      }
      .body p {
        color:#555; font-size:14px; margin-bottom:25px;
      }
      .code-btn {
        display:inline-block;
        padding:15px 40px;
        background: linear-gradient(135deg, #F0C23C, #FF87A2);
        color:#fff;
        font-size:20px;
        letter-spacing:3px;
        border-radius:12px;
        font-weight:bold;
        box-shadow:0 6px 20px rgba(0,0,0,0.25);
        animation: float 2s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% {transform: translateY(0);}
        50% {transform: translateY(-5px);}
      }
      .footer {
        padding:25px; text-align:center; background:#fafafa;
      }
      .social {
        display:inline-block; margin:0 6px; border-radius:50%; width:48px; height:48px; line-height:48px; text-align:center; transition: all 0.3s ease;
      }
      .social img {vertical-align:middle;}
      .social:hover {transform: scale(1.2);}
      .fb {background: linear-gradient(135deg,#3b5998,#8b9dc3);}
      .ig {background: linear-gradient(135deg,#feda75,#d62976);}
      .tw {background: linear-gradient(135deg,#1DA1F2,#0d8ddb);}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>${this.APPLICATION_NAME}</h1>
      </div>
      <div class="body">
        <h2>${title}</h2>
        <p>Your verification code is:</p>
        <div class="code-btn">${code}</div>
      </div>
      <div class="footer">
        <p style="margin-bottom:10px;">Connect with us</p>
        <a href="${this.FACEBOOKLINK}" class="social fb"><img src="https://cdn-icons-png.flaticon.com/512/145/145802.png" width="24"></a>
        <a href="${this.INSTAGRAM}" class="social ig"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="24"></a>
        <a href="${this.TWITTERLINK}" class="social tw"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" width="24"></a>
      </div>
    </div>
  </body>
  </html>
  `;
  };
}