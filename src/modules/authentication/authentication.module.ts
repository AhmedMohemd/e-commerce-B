import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { AuthenticationController } from "./authentication.controller";
import { EmailService} from "src/common/utils/service";
import { SecurityService } from "src/common/module/security/security.service";
import { defaultLanguage } from "src/common/middleware";
// import { SecurityService } from "src/common/module";

@Module({
    imports: [],
    exports: [],
    controllers: [AuthenticationController],
    providers: [
        AuthenticationService,
        EmailService,
        SecurityService,
    ]
})
export class AuthenticationModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(defaultLanguage)
            .forRoutes({
                path: 'auth/*',
                method: RequestMethod.ALL

            });
    }
}