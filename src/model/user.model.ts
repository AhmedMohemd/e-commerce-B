import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule, Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose"
import { HydratedDocument } from "mongoose";
import { GenderEnum, LanguageEnum, ProviderEnum, RoleEnum } from "src/common/enum";
import { IUser } from "src/common/interfaces"
// import { SecurityModule, SecurityService } from "src/common/module";
import { SecurityModule } from "src/common/module/security/security.module";
import { SecurityService } from "src/common/module/security/security.service";
export type HUserDocument = HydratedDocument<IUser>
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    // collection: "user"
})
export class User implements IUser {

    @Prop({ type: String, required: true })
    firstName!: string;
    @Prop({ type: String, required: true })
    lastName!: string;

    @Virtual({
        set: function (this: HUserDocument, value: string) {
            const [firstName, lastName] = value.split(" ") || []
            this.set({ firstName, lastName })
        },
        get: function (this: any) {
            return `${this.firstName} ${this.lastName}`
        }
    })
    username?: string | undefined;
    @Prop({ type: String, required: true, unique: true })
    email!: string;
    @Prop({ type: String, required: function (this: HUserDocument) { return this.provider == ProviderEnum.SYSTEM } })
    password!: string;

    @Prop({ type: String, required: false })
    phone?: string;

    @Prop({ type: String, enum: LanguageEnum, default: LanguageEnum.AR })
    lang!: LanguageEnum;

    @Prop({ type: String, required: false })
    profilePicture?: string;
    @Prop({ type: [String], required: false })
    profileCoverPictures?: string[];

    @Prop({ type: Date })
    DOB?: Date;
    @Prop({ type: Date })
    deletedAt?: Date;
    @Prop({ type: Date })
    restoredAt?: Date;
    @Prop({ type: Date })
    confirmEmail?: Date;
    @Prop({ type: Date })
    changeCredentialsTime?: Date;
    @Prop({ type: Number, enum: GenderEnum, default: GenderEnum.MALE })
    gender!: GenderEnum;
    @Prop({ type: Number, enum: ProviderEnum, default: ProviderEnum.SYSTEM })
    provider!: ProviderEnum;
    @Prop({ type: Number, enum: RoleEnum, default: RoleEnum.USER })
    role!: RoleEnum;
}
export const userSchema = SchemaFactory.createForClass(User)
// export const UserModel = MongooseModule.forFeature([{ name: User.name, schema: userSchema }])
userSchema.pre('save', function () {
    console.log('Hello from pre save one');
});
// export const UserModel = MongooseModule.forFeature([{ name: User.name, schema: userSchema }])
export const UserModel = MongooseModule.forFeatureAsync([
    {
        name: User.name,
        imports: [SecurityModule],
        useFactory: (securityService: SecurityService) => {

            userSchema.pre('save', function () {
                console.log('Hello from pre save');
            });
            userSchema.pre(["find", "findOne"], function () {

                if (this.getQuery().paranoid == false) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: false }
                    })
                }
            })
            userSchema.pre(["updateOne", "findOneAndUpdate"], function () {

                const update = this.getUpdate() as HydratedDocument<IUser>

                if (update.deletedAt) {
                    this.getQuery().paranoId = true
                    this.setUpdate({
                        ...this.getUpdate(),
                        $unset: { restoredAt: 1 }
                    })
                }

                if (update.restoredAt) {
                    this.setQuery({
                        ...this.getQuery(),
                        paranoid: false,
                        deletedAt: { $exists: true }
                    })
                    this.setUpdate({
                        ...this.getUpdate(),
                        $unset: { deletedAt: 1 }
                    })
                }
                if (this.getQuery().paranoid == false) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: false }
                    })
                }
                console.log(this.getQuery());

            })


            userSchema.pre(["deleteOne", "findOneAndDelete"], function () {

                if (this.getQuery().force == true) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: true }
                    })
                }
            })
            userSchema.pre("save", async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {
                this.wasNew = this.isNew;

                if (this.isModified("password")) {
                    this.password = await securityService.generateHash({ plaintext: this.password })
                }
                if (this.phone && this.isModified("phone")) {
                    this.phone = await securityService.generateEncryption(this.phone)
                }
            })


            userSchema.pre("validate", function () {
                // console.log({ this: this });
                if (this.password && this.provider == ProviderEnum.GOOGLE) {
                    throw new BadRequestException("Google account cannot hold password")
                }

                // if (!this.slug || this.slug.includes(" ")) {
                // throw new BadRequestException("Invalid slug format")
                // }
            })

            userSchema.post("validate", function () {
                // console.log("validate post ", { this: this });
            })
            return userSchema;
        },
        inject: [
            SecurityService,
        ]
    },
])