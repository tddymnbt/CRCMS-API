<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

1. Clone the CustomerAPI repository to your `VS Code`:
```bash
https://gitlab.medilink.com.ph/philgood/cms/customer-api-nestjs.git
```
2. Change branch from `main` to your own checkout branch (ex. remote origin `feature/PHILG-454`)

## Setting up the Config

1. Copy the `.env.example` from `.docker\local` to the `root` and name it as `.env` or using the command below:
```bash
cp .docker/local/.env.example .env
```
2. Your .env file should have the ff:

```
DATABASE_HOST=localhost
DATABASE_PORT=port
DATABASE_USERNAME=username
DATABASE_PASSWORD=password
DATABASE_NAME=postgres
JWT_SECRET=<JWT key>
SMTP_HOST=host
SMTP_PORT=port
SMTP_USERNAME=username
SMTP_PASSWORD=password
SMTP_FROM=email
```

## Project setup with Docker

- Open the VS Code terminal and enter `docker-compose up --build`.
- It will automatically compile, build, and run the project.
- To stop the current build, on the terminal click `ctrl + c` and enter `docker-compose down -v`.

## Proposed Folder Structure

```
poc-nest/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   ├── dto/
│   │   │   └── create-user.dto.ts
│   │   ├── exceptions/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   │       └── email-validator.util.ts
│   ├── config/
│   │   └── typeorm.config.ts
│   ├── modules/
│   │   ├── user/
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.module.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.repository.ts
│   │   └── auth/
│   │       ├── dto/
│   │       │   └── auth-credentials.dto.ts
│   │       ├── entities/
│   │       ├── auth.controller.ts
│   │       ├── auth.module.ts
│   │       ├── auth.service.ts
│   │       ├── jwt.strategy.ts
│   │       └── auth.repository.ts
│   ├── app.module.ts
│   ├── main.ts
├── .env
├── .gitignore
├── nest-cli.json
├── package.json
└── tsconfig.json

```

## Folder Definitions

src/
• common/: Contains shared modules and utilities used throughout the application.

• decorators/: Custom decorators for validation, logging, etc.

• dto/: Shared Data Transfer Objects (DTOs) used across modules, such as create-user.dto.ts.

• exceptions/: Custom exceptions or error handling logic.

• filters/: Contains filters like http-exception.filter.ts for global exception handling.

• guards/: Custom guards for authorization.

• interceptors/: Custom interceptors for logging, transformation, etc.

• pipes/: Custom pipes for validation and transformation.

• utils/: Utility functions like email-validator.util.ts.

• config/: Configuration files for different environments or services.

• modules/: Contains feature-specific modules for the application.

## Running API

1. Make sure `internal-tool` and `philgood-db` is running.
2. Open Postman
3. Execute sample API endpoint below
4. Call the API:
   `http://localhost:3000/auth/login`
   `POST`
   supply your desired `{ email, password }`

```
{
  "email": "teodoro_manabat@medilink.ph",
  "password": "password"
}
```
This will send an email containing your `OTP`.

5. Call the API `http://localhost:3000/auth/validate-login` `POST`
```
{
  "email": "teodoro_manabat@medilink.ph",
  "otp": "294540"
}
```

This will return `Token` use for authenticated API calls.

Authenticated Call:

- URL: http://localhost:3000/users
- Method: GET
- Headers:
- Content-Type: application/json
- Authorization: Bearer Token (paste `Token` from `Login`)

6. Access the API Docs on browser using this URL `http://localhost:3000/api`

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).